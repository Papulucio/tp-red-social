import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../interfaces/auth-user.interface.js';

interface JwtPayload {
  sub: string;
  nombreUsuario: string;
  correo: string;
  perfil: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de acceso faltante');
    }

    const token = header.slice(7).trim();

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user: AuthUser = {
        userId: payload.sub,
        nombreUsuario: payload.nombreUsuario,
        correo: payload.correo,
        perfil: payload.perfil,
      };
      (request as Request & { user: AuthUser }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
