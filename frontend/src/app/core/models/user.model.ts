export type Perfil = 'usuario' | 'administrador';

export interface User {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: Perfil;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
