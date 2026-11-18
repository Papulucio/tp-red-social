import { ForbiddenException } from '@nestjs/common';
import { Types, type Model } from 'mongoose';
import { vi } from 'vitest';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import type { PostDocument } from './schemas/post.schema.js';
import { PostsService } from './posts.service.js';

interface ComentarioMock {
  _id: Types.ObjectId;
  autor: Types.ObjectId;
  texto: string;
  fecha: Date;
  modificado?: boolean;
}

type ListaComentarios = ComentarioMock[] & {
  create: ReturnType<typeof vi.fn>;
  id: ReturnType<typeof vi.fn>;
};

describe('PostsService - comentarios', () => {
  const publicacionId = new Types.ObjectId();
  const autorId = new Types.ObjectId();
  const usuario: AuthUser = {
    userId: autorId.toString(),
    nombreUsuario: 'ana',
    correo: 'ana@mail.com',
    perfil: 'usuario',
  };

  let model: {
    findById: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let service: PostsService;

  function crearPost(comentarios: ComentarioMock[]) {
    const lista = [...comentarios] as ListaComentarios;
    lista.create = vi.fn((data: Omit<ComentarioMock, '_id'>) => ({
      _id: new Types.ObjectId(),
      ...data,
    }));
    lista.id = vi.fn((id: string) =>
      lista.find((comentario) => comentario._id.toString() === id),
    );

    const post = {
      activo: true,
      autor: autorId,
      meGusta: [],
      comentarios: lista,
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockResolvedValue(undefined),
    } as unknown as PostDocument;

    return { post, lista };
  }

  beforeEach(() => {
    model = { findById: vi.fn(), findOne: vi.fn() };
    service = new PostsService(model as unknown as Model<PostDocument>);
  });

  it('lista los comentarios más recientes primero con metadatos', async () => {
    const viejo: ComentarioMock = {
      _id: new Types.ObjectId(),
      autor: autorId,
      texto: 'viejo',
      fecha: new Date('2024-01-01T00:00:00Z'),
    };
    const nuevo: ComentarioMock = {
      _id: new Types.ObjectId(),
      autor: autorId,
      texto: 'nuevo',
      fecha: new Date('2024-03-01T00:00:00Z'),
    };
    const medio: ComentarioMock = {
      _id: new Types.ObjectId(),
      autor: autorId,
      texto: 'medio',
      fecha: new Date('2024-02-01T00:00:00Z'),
    };
    const { post } = crearPost([viejo, nuevo, medio]);
    model.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(post) });

    const resultado = await service.listComments(publicacionId.toString(), {
      offset: 0,
      limit: 2,
    });

    expect(resultado.total).toBe(3);
    expect(resultado.hasMore).toBe(true);
    expect(resultado.comentarios.map((item) => item._id)).toEqual([
      nuevo._id.toString(),
      medio._id.toString(),
    ]);
    expect(resultado.comentarios[0]).toMatchObject({
      texto: 'nuevo',
      modificado: false,
      fecha: nuevo.fecha.toISOString(),
    });
  });

  it('devuelve el comentario creado con modificado en false', async () => {
    const { post, lista } = crearPost([]);
    model.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(post) });

    const resultado = await service.addComment(
      publicacionId.toString(),
      usuario,
      { texto: 'hola' },
    );

    expect(lista.create).toHaveBeenCalledWith(
      expect.objectContaining({ texto: 'hola', modificado: false }),
    );
    expect(resultado).toMatchObject({ texto: 'hola', modificado: false });
  });

  it('impide editar un comentario de otro usuario', async () => {
    const comentario: ComentarioMock = {
      _id: new Types.ObjectId(),
      autor: autorId,
      texto: 'viejo',
      fecha: new Date(),
      modificado: false,
    };
    const { post } = crearPost([comentario]);
    model.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(post) });

    await expect(
      service.editComment(
        publicacionId.toString(),
        comentario._id.toString(),
        { texto: 'hola' },
        { ...usuario, userId: new Types.ObjectId().toString() },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marca como modificado al editar el propio comentario', async () => {
    const comentario: ComentarioMock = {
      _id: new Types.ObjectId(),
      autor: autorId,
      texto: 'viejo',
      fecha: new Date(),
      modificado: false,
    };
    const { post } = crearPost([comentario]);
    model.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(post) });

    const resultado = await service.editComment(
      publicacionId.toString(),
      comentario._id.toString(),
      { texto: 'actualizado' },
      usuario,
    );

    expect(resultado).toMatchObject({
      texto: 'actualizado',
      modificado: true,
    });
    expect(comentario.texto).toBe('actualizado');
    expect(comentario.modificado).toBe(true);
  });
});
