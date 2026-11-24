import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Perfil, User, UserDocument } from './schemas/user.schema.js';

export interface CreateUserData {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  password: string;
  fechaNacimiento: Date;
  descripcion?: string;
  imagenPerfil?: string;
  perfil?: Perfil;
  activo?: boolean;
}

export interface UpdateUserData {
  nombre?: string;
  apellido?: string;
  descripcion?: string;
  fechaNacimiento?: Date;
  imagenPerfil?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserData): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  findByCorreo(correo: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ correo: correo.toLowerCase() }).exec();
  }

  findByNombreUsuario(nombreUsuario: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ nombreUsuario }).exec();
  }

  findByIdentifier(identifier: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        $or: [
          { correo: identifier.toLowerCase() },
          { nombreUsuario: identifier },
        ],
      })
      .exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async setActivo(id: string, activo: boolean): Promise<UserDocument> {
    const user = await this.findById(id);
    user.activo = activo;
    return user.save();
  }

  async update(id: string, data: UpdateUserData): Promise<UserDocument> {
    const user = await this.findById(id);
    if (data.nombre !== undefined) user.nombre = data.nombre;
    if (data.apellido !== undefined) user.apellido = data.apellido;
    if (data.descripcion !== undefined) user.descripcion = data.descripcion;
    if (data.fechaNacimiento !== undefined) user.fechaNacimiento = data.fechaNacimiento;
    if (data.imagenPerfil !== undefined) user.imagenPerfil = data.imagenPerfil;
    return user.save();
  }
}
