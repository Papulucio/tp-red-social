import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class QueryPostsDto {
  @IsOptional()
  @IsIn(['fecha', 'likes'], { message: "El orden debe ser 'fecha' o 'likes'" })
  sort?: 'fecha' | 'likes';

  @IsOptional()
  @IsMongoId({ message: 'El userId no es válido' })
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
