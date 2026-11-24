import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Perfil } from '../schemas/user.schema.js';

export class CreateUserAdminDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  apellido: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/, {
    message:
      'El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números, _ o .)',
  })
  nombreUsuario: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
  })
  password: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsEnum(Perfil, { message: 'El perfil debe ser usuario o administrador' })
  perfil: Perfil;
}
