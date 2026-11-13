import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Perfil {
  USUARIO = 'usuario',
  ADMINISTRADOR = 'administrador',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ required: true, unique: true, trim: true })
  nombreUsuario: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop({ default: '' })
  descripcion: string;

  @Prop({ default: '' })
  imagenPerfil: string;

  @Prop({ type: String, enum: Perfil, default: Perfil.USUARIO })
  perfil: Perfil;
}

export const UserSchema = SchemaFactory.createForClass(User);
