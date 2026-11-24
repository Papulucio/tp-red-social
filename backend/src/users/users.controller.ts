import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import { multerOptions } from '../common/multer.config.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { CreateUserAdminDto } from './dto/create-user-admin.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => user.toJSON());
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagenPerfil', multerOptions))
  async create(
    @Body() dto: CreateUserAdminDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const correo = dto.correo.toLowerCase();

    if (await this.usersService.findByCorreo(correo)) {
      throw new BadRequestException('El correo ya está registrado');
    }

    if (await this.usersService.findByNombreUsuario(dto.nombreUsuario)) {
      throw new BadRequestException('El nombre de usuario ya está en uso');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo,
      nombreUsuario: dto.nombreUsuario,
      password,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcion: dto.descripcion ?? '',
      imagenPerfil: file ? `/uploads/${file.filename}` : '',
      perfil: dto.perfil,
      activo: true,
    });

    return user.toJSON();
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async disable(@Param('id') id: string) {
    const user = await this.usersService.setActivo(id, false);
    return user.toJSON();
  }

  @Post(':id/habilitar')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async enable(@Param('id') id: string) {
    const user = await this.usersService.setActivo(id, true);
    return user.toJSON();
  }

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
