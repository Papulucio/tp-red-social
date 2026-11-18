import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { multerOptions } from '../common/multer.config.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { extraerBearer } from './utils/token.util.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagenPerfil', multerOptions))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.authService.registro(dto, file);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  autorizar(@Req() req: Request) {
    return this.authService.autorizar(
      extraerBearer(req.headers.authorization),
    );
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  refrescar(@Req() req: Request) {
    return this.authService.refrescar(
      extraerBearer(req.headers.authorization),
    );
  }
}
