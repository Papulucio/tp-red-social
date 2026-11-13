import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(60)
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(60)
  apellido: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/, {
    message: 'El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números, punto o guion bajo)',
  })
  nombreUsuario: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe tener mínimo 8 caracteres, al menos 1 mayúscula y 1 número',
  })
  password: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La descripción no puede superar los 200 caracteres' })
  descripcion?: string;
}
