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

    const coincide = await bcrypt.compare(dto.password, user.password);

    if (!coincide) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      usuario: user.toJSON(),
      token: this.signToken(user),
    };
  }

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      nombreUsuario: user.nombreUsuario,
      correo: user.correo,
      perfil: user.perfil,
    });
  }
}
