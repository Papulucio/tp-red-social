import { User } from './user.model';

export type AutorResumen = Pick<
  User,
  '_id' | 'nombre' | 'apellido' | 'nombreUsuario' | 'imagenPerfil'
>;

export interface Comentario {
  _id?: string;
  autor: AutorResumen | string;
  texto: string;
  fecha: string;
}

export interface Post {
  _id: string;
  titulo: string;
  mensaje: string;
  imagenUrl: string;
  autor: AutorResumen | string;
  meGusta: string[];
  comentarios: Comentario[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  total: number;
  offset: number;
  limit: number;
  publicaciones: Post[];
}
