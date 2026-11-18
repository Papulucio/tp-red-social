import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../interfaces/auth-user.interface.js';
import {
  type PayloadSinNormalizar,
  extraerBearer,
  normalizarPayload,
} from '../utils/token.util.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extraerBearer(request.headers.authorization);

    try {
      const payload = normalizarPayload(
        this.jwtService.verify<PayloadSinNormalizar>(token),
      );
      const user: AuthUser = {
        userId: payload.uuid,
        nombreUsuario: payload.nombreUsuario,
        correo: payload.correo,
        perfil: payload.rol,
      };
      (request as Request & { user: AuthUser }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
