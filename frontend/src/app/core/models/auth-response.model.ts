import { Perfil, User } from './user.model';

export interface AuthResponse {
  usuario: User;
  token: string;
}

export interface AutorizarResponse {
  uuid: string;
  correo: string;
  nombreUsuario: string;
  rol: Perfil;
  usuario: User;
}
