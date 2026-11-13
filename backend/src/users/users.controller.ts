import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/multer.config.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return user.toJSON();
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagenPerfil', multerOptions))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @GetUser() currentUser: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const esPropietario = currentUser.userId === id;
    const esAdmin = currentUser.perfil === 'administrador';
    if (!esPropietario && !esAdmin) {
      throw new ForbiddenException('No podés editar el perfil de otro usuario');
    }

    const user = await this.usersService.update(id, {
      nombre: dto.nombre,
      apellido: dto.apellido,
      descripcion: dto.descripcion,
      fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      imagenPerfil: file ? `/uploads/${file.filename}` : undefined,
    });
    return user.toJSON();
  }
}
