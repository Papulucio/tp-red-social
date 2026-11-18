import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Comentario,
  ComentariosResponse,
  Post,
  PostListResponse,
} from '../models/post.model';

export interface PostQuery {
  sort?: 'fecha' | 'likes';
  userId?: string;
  offset?: number;
  limit?: number;
}

export interface CommentQuery {
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/publicaciones`;

  listar(query: PostQuery = {}): Observable<PostListResponse> {
    let params = new HttpParams();
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    if (query.userId) {
      params = params.set('userId', query.userId);
    }
    if (query.offset !== undefined) {
      params = params.set('offset', query.offset);
    }
    if (query.limit !== undefined) {
      params = params.set('limit', query.limit);
    }
    return this.http.get<PostListResponse>(this.apiUrl, { params });
  }

  obtener(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return this.listar({ limit: 50 }).pipe(
            map((res) => {
              const post = res.publicaciones.find((item) => item._id === id);
              if (!post) {
                throw error;
              }
              return { ...post, comentarios: [] };
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  crear(formData: FormData): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, formData);
  }

  eliminar(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  darLike(id: string): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${id}/like`, {});
  }

  quitarLike(id: string): Observable<Post> {
    return this.http.delete<Post>(`${this.apiUrl}/${id}/like`);
  }

  listarComentarios(
    id: string,
    query: CommentQuery = {},
  ): Observable<ComentariosResponse> {
    let params = new HttpParams();
    if (query.offset !== undefined) {
      params = params.set('offset', query.offset);
    }
    if (query.limit !== undefined) {
      params = params.set('limit', query.limit);
    }

    return this.http
      .get<ComentariosResponse>(`${this.apiUrl}/${id}/comentarios`, { params })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return this.obtener(id).pipe(
              map((post) => this.comentariosDesdePost(post, query)),
            );
          }
          return throwError(() => error);
        }),
      );
  }

  comentar(id: string, texto: string): Observable<Comentario> {
    return this.http
      .post<Comentario | Post>(`${this.apiUrl}/${id}/comentarios`, { texto })
      .pipe(
        map((res) =>
          'texto' in res
            ? this.normalizarComentario(res)
            : this.ultimoComentario(res),
        ),
      );
  }

  editarComentario(
    pubId: string,
    commentId: string,
    texto: string,
  ): Observable<Comentario> {
    return this.http
      .put<Comentario>(
        `${this.apiUrl}/${pubId}/comentarios/${commentId}`,
        { texto },
      )
      .pipe(map((res) => this.normalizarComentario(res)));
  }

  private ultimoComentario(post: Post): Comentario {
    const ordenados = [...post.comentarios].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
    const comentario = ordenados[0];
    if (!comentario) {
      throw new Error('No se pudo obtener el comentario creado');
    }
    return this.normalizarComentario(comentario);
  }

  private comentariosDesdePost(
    post: Post,
    query: CommentQuery,
  ): ComentariosResponse {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 5;
    const ordenados = [...post.comentarios].sort(
      (a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
        (b._id ?? '').localeCompare(a._id ?? ''),
    );
    const pagina = ordenados
      .slice(offset, offset + limit)
      .map((comentario) => this.normalizarComentario(comentario));

    return {
      total: ordenados.length,
      offset,
      limit,
      hasMore: offset + pagina.length < ordenados.length,
      comentarios: pagina,
    };
  }

  private normalizarComentario(comentario: Partial<Comentario>): Comentario {
    return {
      _id: comentario._id ?? '',
      autor: comentario.autor ?? '',
      texto: comentario.texto ?? '',
      fecha: comentario.fecha ?? new Date().toISOString(),
      modificado: Boolean(comentario.modificado),
    };
  }
}
