import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async publicacionesPorUsuario(query: StatsQueryDto) {
    const { desde, hasta } = this.rango(query);

    return this.postModel.aggregate([
      {
        $match: {
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: '$autor',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          nombreUsuario: {
            $ifNull: ['$usuario.nombreUsuario', 'Usuario eliminado'],
          },
          nombre: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$usuario.nombre', ''] },
                  ' ',
                  { $ifNull: ['$usuario.apellido', ''] },
                ],
              },
            },
          },
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, nombreUsuario: 1 } },
    ]);
  }

  async comentariosPorPeriodo(query: StatsQueryDto) {
    const { desde, hasta } = this.rango(query);

    return this.postModel.aggregate([
      { $unwind: '$comentarios' },
      {
        $match: {
          'comentarios.fecha': { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$comentarios.fecha' },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          fecha: '$_id',
          cantidad: 1,
        },
      },
      { $sort: { fecha: 1 } },
    ]);
  }

  async comentariosPorPublicacion(query: StatsQueryDto) {
    const { desde, hasta } = this.rango(query);

    return this.postModel.aggregate([
      { $unwind: '$comentarios' },
      {
        $match: {
          'comentarios.fecha': { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: '$_id',
          titulo: { $first: '$titulo' },
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          publicacionId: '$_id',
          titulo: 1,
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, titulo: 1 } },
    ]);
  }

  private rango(query: StatsQueryDto): { desde: Date; hasta: Date } {
    const desde = new Date(query.fechaInicio);
    const hasta = new Date(query.fechaFin);

    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      throw new BadRequestException('El rango de fechas no es válido');
    }

    if (desde > hasta) {
      throw new BadRequestException('fechaInicio no puede ser mayor a fechaFin');
    }

    if (query.fechaInicio.length <= 10) {
      desde.setUTCHours(0, 0, 0, 0);
    }
    if (query.fechaFin.length <= 10) {
      hasta.setUTCHours(23, 59, 59, 999);
    }

    return { desde, hasta };
  }
}
