import { IsDateString } from 'class-validator';

export class StatsQueryDto {
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida' })
  fechaInicio: string;

  @IsDateString({}, { message: 'fechaFin debe ser una fecha válida' })
  fechaFin: string;
}
