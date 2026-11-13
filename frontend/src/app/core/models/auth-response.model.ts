import { User } from './user.model';

export interface AuthResponse {
  usuario: User;
  token: string;
}
