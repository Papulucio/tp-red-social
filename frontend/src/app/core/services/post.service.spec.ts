import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide los comentarios con offset y limit', () => {
    let resultado: unknown;

    service
      .listarComentarios('pub-1', { offset: 5, limit: 5 })
      .subscribe((res) => (resultado = res));

    const req = http.expectOne((request) =>
      request.url.endsWith('/publicaciones/pub-1/comentarios'),
    );
    expect(req.request.params.get('offset')).toBe('5');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({
      total: 7,
      offset: 5,
      limit: 5,
      hasMore: false,
      comentarios: [],
    });

    expect(resultado).toMatchObject({ total: 7, hasMore: false });
  });

  it('normaliza el comentario creado por el backend', () => {
    let resultado: unknown;

    service.comentar('pub-1', 'hola').subscribe((res) => (resultado = res));

    const req = http.expectOne((request) =>
      request.url.endsWith('/publicaciones/pub-1/comentarios'),
    );
    req.flush({
      _id: 'c-1',
      autor: 'u-1',
      texto: 'hola',
      fecha: '2024-01-01T00:00:00.000Z',
      modificado: false,
    });

    expect(resultado).toEqual({
      _id: 'c-1',
      autor: 'u-1',
      texto: 'hola',
      fecha: '2024-01-01T00:00:00.000Z',
      modificado: false,
    });
  });

  it('acepta la respuesta antigua de comentarios del backend', () => {
    let resultado: unknown;

    service.comentar('pub-1', 'hola').subscribe((res) => (resultado = res));

    const req = http.expectOne((request) =>
      request.url.endsWith('/publicaciones/pub-1/comentarios'),
    );
    req.flush({
      _id: 'pub-1',
      comentarios: [
        {
          _id: 'c-1',
          autor: 'u-1',
          texto: 'hola',
          fecha: '2024-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(resultado).toMatchObject({ _id: 'c-1', texto: 'hola', modificado: false });
  });

  it('envía la edición a la ruta anidada', () => {
    service.editarComentario('pub-1', 'c-1', 'editado').subscribe();

    const req = http.expectOne((request) =>
      request.url.endsWith('/publicaciones/pub-1/comentarios/c-1'),
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ texto: 'editado' });
    req.flush({
      _id: 'c-1',
      autor: 'u-1',
      texto: 'editado',
      fecha: '2024-01-01T00:00:00.000Z',
      modificado: true,
    });
  });
});
