import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  finalize,
  of,
  take,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AutorizarResponse,
} from '../models/auth-response.model';
import { User } from '../models/user.model';
import { SessionService } from './session.service';

const TOKEN_KEY = 'rs_token';
const USER_KEY = 'rs_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<User | null>(this.loadUser());
  private readonly _inicializado = signal(false);
  private readonly inicializadoSubject = new BehaviorSubject<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(
    () => this._currentUser()?.perfil === 'administrador',
  );
  readonly inicializado = this._inicializado.asReadonly();
  readonly inicializando = signal(false);
  readonly cuandoInicializado$ = this.inicializadoSubject.pipe(
    filter(Boolean),
    take(1),
  );

  constructor() {
    this.session.expirado$.subscribe(() => {
      this.logout();
      void this.router.navigate(['/login']);
    });
  }

  login(identificador: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { identificador, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  registro(formData: FormData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/registro`, formData)
      .pipe(tap((res) => this.setSession(res)));
  }

  inicializar(): void {
    if (this._inicializado()) {
      return;
    }

    this.inicializando.set(true);
    this.autorizar()
      .pipe(
        finalize(() => {
          this.inicializando.set(false);
          this.marcarInicializado();
        }),
      )
      .subscribe({
        next: (res) =>
          this.setSession({ token: this.getToken() ?? '', usuario: res.usuario }),
        error: () => this.logout(),
      });
  }

  autorizar(): Observable<AutorizarResponse> {
    return this.http
      .post<AutorizarResponse>(`${this.apiUrl}/autorizar`, {})
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const usuario = this.loadUser();
          if (error.status === 404 && usuario) {
            return of({
              uuid: usuario._id,
              correo: usuario.correo,
              nombreUsuario: usuario.nombreUsuario,
              rol: usuario.perfil,
              usuario,
            });
          }
          return throwError(() => error);
        }),
      );
  }

  refrescar(): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/refrescar`, {})
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const token = this.getToken();
          if (error.status === 404 && token) {
            return of({ token });
          }
          return throwError(() => error);
        }),
        tap((res) => {
          this.guardarToken(res.token);
          this.session.start();
        }),
      );
  }

  logout(): void {
    this.session.clear();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private marcarInicializado(): void {
    if (!this._inicializado()) {
      this._inicializado.set(true);
      this.inicializadoSubject.next(true);
    }
  }

  private guardarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private setSession(res: AuthResponse): void {
    this.guardarToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
    this._currentUser.set(res.usuario);
    this.session.start();
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
