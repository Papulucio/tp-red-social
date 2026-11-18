import { UnauthorizedException } from '@nestjs/common';
import { extraerBearer, normalizarPayload } from './token.util.js';

describe('token.util', () => {
  it('extrae el token del header Bearer', () => {
    expect(extraerBearer('Bearer abc123')).toBe('abc123');
  });

  it('rechaza un header ausente o malformado', () => {
    expect(() => extraerBearer(undefined)).toThrow(UnauthorizedException);
    expect(() => extraerBearer('Basic abc')).toThrow(UnauthorizedException);
  });

  it('normaliza claims legacy a uuid y rol', () => {
    expect(
      normalizarPayload({
        sub: 'user-1',
        perfil: 'administrador',
        correo: 'admin@mail.com',
        nombreUsuario: 'admin',
      }),
    ).toEqual({
      uuid: 'user-1',
      rol: 'administrador',
      correo: 'admin@mail.com',
      nombreUsuario: 'admin',
    });
  });

  it('rechaza un payload incompleto', () => {
    expect(() => normalizarPayload({ correo: 'a@mail.com' })).toThrow(
      UnauthorizedException,
    );
  });
});
