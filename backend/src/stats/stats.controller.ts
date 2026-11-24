import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';
import { StatsService } from './stats.service.js';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() query: StatsQueryDto) {
    return this.statsService.publicacionesPorUsuario(query);
  }

  @Get('comentarios-por-periodo')
  comentariosPorPeriodo(@Query() query: StatsQueryDto) {
    return this.statsService.comentariosPorPeriodo(query);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() query: StatsQueryDto) {
    return this.statsService.comentariosPorPublicacion(query);
  }
}
