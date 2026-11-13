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
import { QueryPostsDto } from './dto/query-posts.dto.js';
import { Comentario, Post, PostDocument } from './schemas/post.schema.js';

const AUTOR_SELECT = 'nombre apellido nombreUsuario imagenPerfil';

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

  async addComment(id: string, user: AuthUser, dto: CreateCommentDto) {
    const post = await this.getActivePost(id);

    post.comentarios.push({
      autor: new Types.ObjectId(user.userId),
      texto: dto.texto,
      fecha: new Date(),
    } as Comentario);

    await post.save();

    return this.populateOne(id);
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

  private populateOne(id: string): Promise<PostDocument | null> {
    return this.postModel
      .findById(id)
      .populate({ path: 'autor', select: AUTOR_SELECT })
      .populate({ path: 'comentarios.autor', select: AUTOR_SELECT })
      .exec();
  }
}
