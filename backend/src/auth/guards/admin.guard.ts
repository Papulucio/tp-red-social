import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../interfaces/auth-user.interface.js';
import { Perfil } from '../../users/schemas/user.schema.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user;

    if (!user || user.perfil !== Perfil.ADMINISTRADOR) {
      throw new ForbiddenException(
        'Acceso restringido a administradores',
      );
    }

    return true;
  }
}
