import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import {
  type JwtPayload,
  type PayloadSinNormalizar,
  normalizarPayload,
} from './utils/token.util.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registro(dto: RegistroDto, file?: Express.Multer.File) {
    const correo = dto.correo.toLowerCase();

    if (await this.usersService.findByCorreo(correo)) {
      throw new BadRequestException('El correo ya está registrado');
    }

    if (await this.usersService.findByNombreUsuario(dto.nombreUsuario)) {
      throw new BadRequestException('El nombre de usuario ya está en uso');
    }

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo,
      nombreUsuario: dto.nombreUsuario,
      password,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcion: dto.descripcion ?? '',
      imagenPerfil: file ? `/uploads/${file.filename}` : '',
    });

    return {
      usuario: user.toJSON(),
      token: this.signToken(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentifier(dto.identificador);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.activo === false) {
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá al administrador.',
      );
    }

    const coincide = await bcrypt.compare(dto.password, user.password);

    if (!coincide) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      usuario: user.toJSON(),
      token: this.signToken(user),
    };
  }

  async autorizar(token: string) {
    const payload = this.verificar(token);

    let usuario: UserDocument;
    try {
      usuario = await this.usersService.findById(payload.uuid);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (usuario.activo === false) {
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá al administrador.',
      );
    }

    return {
      uuid: payload.uuid,
      correo: payload.correo,
      nombreUsuario: payload.nombreUsuario,
      rol: payload.rol,
      usuario: usuario.toJSON(),
    };
  }

  refrescar(token: string) {
    const payload = this.verificar(token);
    return { token: this.jwtService.sign(payload) };
  }

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      uuid: user._id.toString(),
      nombreUsuario: user.nombreUsuario,
      correo: user.correo,
      rol: user.perfil,
    });
  }

  private verificar(token: string): JwtPayload {
    try {
      return normalizarPayload(
        this.jwtService.verify<PayloadSinNormalizar>(token),
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
