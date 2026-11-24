import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ComentariosPorPeriodoStat,
  ComentariosPorPublicacionStat,
  PublicacionesPorUsuarioStat,
  StatsQuery,
} from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/estadisticas`;

  publicacionesPorUsuario(query: StatsQuery): Observable<PublicacionesPorUsuarioStat[]> {
    return this.http.get<PublicacionesPorUsuarioStat[]>(
      `${this.apiUrl}/publicaciones-por-usuario`,
      { params: this.params(query) },
    );
  }

  comentariosPorPeriodo(query: StatsQuery): Observable<ComentariosPorPeriodoStat[]> {
    return this.http.get<ComentariosPorPeriodoStat[]>(
      `${this.apiUrl}/comentarios-por-periodo`,
      { params: this.params(query) },
    );
  }

  comentariosPorPublicacion(query: StatsQuery): Observable<ComentariosPorPublicacionStat[]> {
    return this.http.get<ComentariosPorPublicacionStat[]>(
      `${this.apiUrl}/comentarios-por-publicacion`,
      { params: this.params(query) },
    );
  }

  private params(query: StatsQuery): HttpParams {
    return new HttpParams()
      .set('fechaInicio', query.fechaInicio)
      .set('fechaFin', query.fechaFin);
  }
}
