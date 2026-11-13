import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Post, PostListResponse } from '../models/post.model';

export interface PostQuery {
  sort?: 'fecha' | 'likes';
  userId?: string;
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

  comentar(id: string, texto: string): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${id}/comentarios`, { texto });
  }
}
