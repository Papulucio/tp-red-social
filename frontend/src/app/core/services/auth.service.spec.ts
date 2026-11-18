import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let http: HttpTestingController;

  const usuario: User = {
    _id: 'user-1',
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@mail.com',
    nombreUsuario: 'ana',
    fechaNacimiento: '1990-01-01',
    descripcion: '',
    imagenPerfil: '',
    perfil: 'usuario',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('usa la sesión local si el backend aún no tiene /auth/autorizar', () => {
    localStorage.setItem('rs_token', 'token-viejo');
    localStorage.setItem('rs_usuario', JSON.stringify(usuario));
    const service = TestBed.inject(AuthService);

    service.inicializar();

    const req = http.expectOne((request) =>
      request.url.endsWith('/auth/autorizar'),
    );
    req.flush('', { status: 404, statusText: 'Not Found' });

    expect(service.inicializado()).toBe(true);
    expect(service.currentUser()).toEqual(usuario);
    expect(service.getToken()).toBe('token-viejo');
  });

  it('limpia la sesión cuando /auth/autorizar responde 401', () => {
    localStorage.setItem('rs_token', 'token-viejo');
    localStorage.setItem('rs_usuario', JSON.stringify(usuario));
    const service = TestBed.inject(AuthService);

    service.inicializar();

    const req = http.expectOne((request) =>
      request.url.endsWith('/auth/autorizar'),
    );
    req.flush('', { status: 401, statusText: 'Unauthorized' });

    expect(service.inicializado()).toBe(true);
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('mantiene el token si el backend aún no tiene /auth/refrescar', () => {
    localStorage.setItem('rs_token', 'token-viejo');
    const service = TestBed.inject(AuthService);
    let respuesta: { token: string } | null = null;

    service.refrescar().subscribe((res) => (respuesta = res));

    const req = http.expectOne((request) =>
      request.url.endsWith('/auth/refrescar'),
    );
    req.flush('', { status: 404, statusText: 'Not Found' });

    expect(respuesta).toEqual({ token: 'token-viejo' });
    expect(service.getToken()).toBe('token-viejo');
  });
});
