import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module.js';
import { Perfil, User, UserDocument } from '../users/schemas/user.schema.js';

async function seedAdmin(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    const nombre = process.env.ADMIN_NOMBRE ?? 'Administrador';
    const apellido = process.env.ADMIN_APELLIDO ?? 'Red Social';
    const correo = (
      process.env.ADMIN_EMAIL ?? 'admin@redsocial.com'
    ).toLowerCase();
    const nombreUsuario = process.env.ADMIN_USERNAME ?? 'admin';
    const password = process.env.ADMIN_PASSWORD ?? 'Admin1234';

    const existente = await userModel.findOne({
      $or: [{ correo }, { nombreUsuario }],
    });

    if (existente) {
      existente.perfil = Perfil.ADMINISTRADOR;
      await existente.save();
      console.log(
        `Usuario promovido a administrador: ${existente.correo} (usuario: ${existente.nombreUsuario})`,
      );
    } else {
      const hash = await bcrypt.hash(password, 10);
      await userModel.create({
        nombre,
        apellido,
        correo,
        nombreUsuario,
        password: hash,
        fechaNacimiento: new Date('1990-01-01'),
        descripcion: 'Cuenta de administrador',
        imagenPerfil: '',
        perfil: Perfil.ADMINISTRADOR,
      });
      console.log(
        `Administrador creado -> correo: ${correo} | usuario: ${nombreUsuario} | contraseña: ${password}`,
      );
    }
  } finally {
    await app.close();
  }
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Error al crear el administrador:', error);
    process.exit(1);
  });
