export interface PublicacionesPorUsuarioStat {
  usuarioId: string;
  nombreUsuario: string;
  nombre: string;
  cantidad: number;
}

export interface ComentariosPorPeriodoStat {
  fecha: string;
  cantidad: number;
}

export interface ComentariosPorPublicacionStat {
  publicacionId: string;
  titulo: string;
  cantidad: number;
}

export interface StatsQuery {
  fechaInicio: string;
  fechaFin: string;
}
