import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const multerOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, callback) => {
      const ext = extname(file.originalname).toLowerCase();
      const nombre = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
      callback(null, nombre);
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      callback(new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png, gif, webp)'), false);
      return;
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};
