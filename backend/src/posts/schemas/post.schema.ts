import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema()
export class Comentario {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  autor: Types.ObjectId;

  @Prop({ required: true, trim: true })
  texto: string;

  @Prop({ default: () => new Date() })
  fecha: Date;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true, trim: true })
  mensaje: string;

  @Prop({ default: '' })
  imagenUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  autor: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  meGusta: Types.ObjectId[];

  @Prop({ type: [ComentarioSchema], default: [] })
  comentarios: Comentario[];

  @Prop({ default: true })
  activo: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
