import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  obtener(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  crear(formData: FormData): Observable<User> {
    return this.http.post<User>(this.apiUrl, formData);
  }

  actualizar(id: string, formData: FormData): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, formData);
  }

  deshabilitar(id: string): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/${id}`);
  }

  habilitar(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/habilitar`, {});
  }
}
