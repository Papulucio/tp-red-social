import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import {
  Perfil,
  type UserDocument,
} from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let users: { findById: ReturnType<typeof vi.fn> };

  const usuario = {
    _id: { toString: () => 'user-1' },
    nombreUsuario: 'ana',
    correo: 'ana@mail.com',
    perfil: Perfil.USUARIO,
    toJSON: () => ({
      _id: 'user-1',
      nombreUsuario: 'ana',
      correo: 'ana@mail.com',
      perfil: 'usuario',
    }),
  } as unknown as UserDocument;

  beforeEach(async () => {
    jwt = { sign: vi.fn(), verify: vi.fn() };
    users = { findById: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('firma el payload con uuid y rol', () => {
    jwt.sign.mockReturnValue('firma');

    const signToken = (
      service as unknown as {
        signToken: (user: UserDocument) => string;
      }
    ).signToken;

    expect(signToken.call(service, usuario)).toBe('firma');
    expect(jwt.sign).toHaveBeenCalledWith({
      uuid: 'user-1',
      nombreUsuario: 'ana',
      correo: 'ana@mail.com',
      rol: Perfil.USUARIO,
    });
  });

  it('autoriza un token legacy y devuelve el perfil completo', async () => {
    jwt.verify.mockReturnValue({
      sub: 'user-1',
      perfil: 'usuario',
      correo: 'ana@mail.com',
      nombreUsuario: 'ana',
    });
    users.findById.mockResolvedValue(usuario);

    const resultado = await service.autorizar('token');

    expect(users.findById).toHaveBeenCalledWith('user-1');
    expect(resultado).toMatchObject({
      uuid: 'user-1',
      rol: 'usuario',
      correo: 'ana@mail.com',
      nombreUsuario: 'ana',
    });
    expect(resultado.usuario).toEqual({
      _id: 'user-1',
      nombreUsuario: 'ana',
      correo: 'ana@mail.com',
      perfil: 'usuario',
    });
  });

  it('rechaza autorizar si el usuario ya no existe', async () => {
    jwt.verify.mockReturnValue({
      uuid: 'user-1',
      rol: 'usuario',
      correo: 'ana@mail.com',
      nombreUsuario: 'ana',
    });
    users.findById.mockRejectedValue(new NotFoundException());

    await expect(service.autorizar('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresca reutilizando exactamente el payload', () => {
    const payload = {
      uuid: 'user-1',
      rol: 'usuario',
      correo: 'ana@mail.com',
      nombreUsuario: 'ana',
    };
    jwt.verify.mockReturnValue(payload);
    jwt.sign.mockReturnValue('nuevo-token');

    expect(service.refrescar('token')).toEqual({ token: 'nuevo-token' });
    expect(jwt.sign).toHaveBeenCalledWith(payload);
  });
});
