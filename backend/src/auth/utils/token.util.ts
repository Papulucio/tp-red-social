import { UnauthorizedException } from '@nestjs/common';
import type { Perfil } from '../../users/schemas/user.schema.js';

export interface JwtPayload {
  uuid: string;
  correo: string;
  nombreUsuario: string;
  rol: Perfil;
}

export interface PayloadSinNormalizar {
  uuid?: string;
  sub?: string;
  correo?: string;
  nombreUsuario?: string;
  rol?: string | Perfil;
  perfil?: string | Perfil;
}

export function extraerBearer(header?: string): string {
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedException('Token de acceso faltante');
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new UnauthorizedException('Token de acceso faltante');
  }

  return token;
}

export function normalizarPayload(payload: PayloadSinNormalizar): JwtPayload {
  const uuid = payload.uuid ?? payload.sub;
  const rol = payload.rol ?? payload.perfil;

  if (!uuid || !rol || !payload.correo || !payload.nombreUsuario) {
    throw new UnauthorizedException('Token inválido o expirado');
  }

  return {
    uuid,
    correo: payload.correo,
    nombreUsuario: payload.nombreUsuario,
    rol: rol as Perfil,
  };
}
