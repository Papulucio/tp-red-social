import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { QueryCommentsDto } from './dto/query-comments.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { Comentario, Post, PostDocument } from './schemas/post.schema.js';

const AUTOR_SELECT = 'nombre apellido nombreUsuario imagenPerfil';
const LIMITE_COMENTARIOS = 5;

type ComentarioConId = Comentario & { _id: Types.ObjectId };

export interface ComentarioResponse {
  _id: string;
  autor: unknown;
  texto: string;
  fecha: string;
  modificado: boolean;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async create(
    dto: CreatePostDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<PostDocument | null> {
    const post = new this.postModel({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      imagenUrl: file ? `/uploads/${file.filename}` : '',
      autor: new Types.ObjectId(userId),
    });
    const saved = await post.save();
    return this.populateOne(saved._id.toString());
  }

  async findAll(query: QueryPostsDto) {
    const filter = query.userId
      ? { activo: true, autor: new Types.ObjectId(query.userId) }
      : { activo: true };

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;

    const posts = await this.postModel
      .find(filter)
      .populate({ path: 'autor', select: AUTOR_SELECT })
      .populate({ path: 'comentarios.autor', select: AUTOR_SELECT })
      .exec();

    const ordenadas =
      query.sort === 'likes'
        ? posts.sort(
            (a, b) =>
              b.meGusta.length - a.meGusta.length ||
              Number(b.createdAt) - Number(a.createdAt),
          )
        : posts.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    return {
      total: ordenadas.length,
      offset,
      limit,
      publicaciones: ordenadas.slice(offset, offset + limit),
    };
  }

  async findOne(id: string) {
    const post = await this.populateOne(id);
    if (!post || !post.activo) {
      throw new NotFoundException('Publicación no encontrada');
    }
    const detalle = post.toJSON() as unknown as Record<string, unknown>;
    detalle.comentarios = [];
    return detalle;
  }

  async remove(id: string, user: AuthUser) {
    const post = await this.getActivePost(id);

    const esAutor = post.autor.toString() === user.userId;
    const esAdmin = user.perfil === 'administrador';

    if (!esAutor && !esAdmin) {
      throw new ForbiddenException(
        'No tenés permiso para eliminar esta publicación',
      );
    }

    post.activo = false;
    await post.save();

    return { message: 'Publicación eliminada correctamente' };
  }

  async like(id: string, user: AuthUser) {
    const post = await this.getActivePost(id);

    const yaDio = post.meGusta.some((u) => u.toString() === user.userId);
    if (yaDio) {
      throw new BadRequestException('Ya le diste me gusta a esta publicación');
    }

    post.meGusta.push(new Types.ObjectId(user.userId));
    await post.save();

    return this.populateOne(id);
  }

  async unlike(id: string, user: AuthUser) {
    const post = await this.getActivePost(id);

    const indice = post.meGusta.findIndex((u) => u.toString() === user.userId);
    if (indice === -1) {
      throw new BadRequestException(
        'No le habías dado me gusta a esta publicación',
      );
    }

    post.meGusta.splice(indice, 1);
    await post.save();

    return this.populateOne(id);
  }

  async listComments(id: string, query: QueryCommentsDto) {
    const post = await this.getActivePost(id);
    await post.populate({ path: 'comentarios.autor', select: AUTOR_SELECT });

    const comentarios = [...post.comentarios] as ComentarioConId[];
    comentarios.sort(
      (a, b) =>
        Number(new Date(b.fecha)) - Number(new Date(a.fecha)) ||
        b._id.toString().localeCompare(a._id.toString()),
    );

    const offset = query.offset ?? 0;
    const limit = query.limit ?? LIMITE_COMENTARIOS;
    const pagina = comentarios.slice(offset, offset + limit);

    return {
      total: comentarios.length,
      offset,
      limit,
      hasMore: offset + pagina.length < comentarios.length,
      comentarios: pagina.map((comentario) =>
        this.aComentarioResponse(comentario),
      ),
    };
  }

  async addComment(id: string, user: AuthUser, dto: CreateCommentDto) {
    const post = await this.getActivePost(id);
    const comentarios = post.comentarios as Types.DocumentArray<ComentarioConId>;

    const comentario = comentarios.create({
      autor: new Types.ObjectId(user.userId),
      texto: dto.texto,
      fecha: new Date(),
      modificado: false,
    } as ComentarioConId);
    comentarios.push(comentario);
    await post.save();
    await post.populate({ path: 'comentarios.autor', select: AUTOR_SELECT });

    const guardado = comentarios.id(comentario._id.toString());
    if (!guardado) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return this.aComentarioResponse(guardado as ComentarioConId);
  }

  async editComment(
    pubId: string,
    commentId: string,
    dto: UpdateCommentDto,
    user: AuthUser,
  ) {
    const post = await this.getPostPorComentario(pubId, commentId);
    const comentarios = post.comentarios as Types.DocumentArray<ComentarioConId>;
    const comentario = comentarios.id(commentId);

    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }
    if (comentario.autor.toString() !== user.userId) {
      throw new ForbiddenException(
        'No tenés permiso para editar este comentario',
      );
    }

    comentario.texto = dto.texto;
    comentario.modificado = true;
    await post.save();
    await post.populate({ path: 'comentarios.autor', select: AUTOR_SELECT });

    const actualizado = comentarios.id(commentId);
    if (!actualizado) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return this.aComentarioResponse(actualizado as ComentarioConId);
  }

  private async getActivePost(id: string): Promise<PostDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Publicación no encontrada');
    }
    const post = await this.postModel.findById(id).exec();
    if (!post || !post.activo) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return post;
  }

  private async getPostPorComentario(
    pubId: string,
    commentId: string,
  ): Promise<PostDocument> {
    if (!isValidObjectId(pubId) || !isValidObjectId(commentId)) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const post = await this.postModel
      .findOne({
        activo: true,
        _id: new Types.ObjectId(pubId),
        'comentarios._id': new Types.ObjectId(commentId),
      })
      .exec();

    if (!post) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return post;
  }

  private aComentarioResponse(
    comentario: ComentarioConId,
  ): ComentarioResponse {
    return {
      _id: comentario._id.toString(),
      autor: comentario.autor,
      texto: comentario.texto,
      fecha: new Date(comentario.fecha).toISOString(),
      modificado: Boolean(comentario.modificado),
    };
  }

  private populateOne(id: string): Promise<PostDocument | null> {
    return this.postModel
      .findById(id)
      .populate({ path: 'autor', select: AUTOR_SELECT })
      .populate({ path: 'comentarios.autor', select: AUTOR_SELECT })
      .exec();
  }
}
