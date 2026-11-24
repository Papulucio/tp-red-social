import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';
import { StatsService } from '../../../core/services/stats.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extraerMensajeError } from '../../../core/utils/error-message';

@Component({
  selector: 'app-estadisticas',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
})
export class EstadisticasComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly notificacion = inject(NotificationService);

  readonly cargando = signal(true);
  readonly fechaInicio = signal(this.fechaHace(30));
  readonly fechaFin = signal(this.hoy());

  readonly barData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly lineData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly doughnutData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };
  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };
  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.fechaInicio() > this.fechaFin()) {
      this.notificacion.error('La fecha desde no puede ser mayor a la fecha hasta');
      return;
    }
    this.cargando.set(true);
    const query = { fechaInicio: this.fechaInicio(), fechaFin: this.fechaFin() };

    forkJoin({
      porUsuario: this.statsService.publicacionesPorUsuario(query),
      porPeriodo: this.statsService.comentariosPorPeriodo(query),
      porPublicacion: this.statsService.comentariosPorPublicacion(query),
    }).subscribe({
      next: ({ porUsuario, porPeriodo, porPublicacion }) => {
        this.barData.set({
          labels: porUsuario.map((i) => i.nombreUsuario),
          datasets: [
            {
              label: 'Publicaciones',
              data: porUsuario.map((i) => i.cantidad),
              backgroundColor: '#5c6bc0',
            },
          ],
        });
        this.lineData.set({
          labels: porPeriodo.map((i) => i.fecha),
          datasets: [
            {
              label: 'Comentarios',
              data: porPeriodo.map((i) => i.cantidad),
              borderColor: '#26a69a',
              backgroundColor: 'rgba(38,166,154,0.2)',
              fill: true,
              tension: 0.3,
            },
          ],
        });
        this.doughnutData.set({
          labels: porPublicacion.map((i) => i.titulo),
          datasets: [
            {
              label: 'Comentarios',
              data: porPublicacion.map((i) => i.cantidad),
              backgroundColor: [
                '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350',
                '#26c6da', '#8d6e63', '#78909c',
              ],
            },
          ],
        });
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private fechaHace(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().slice(0, 10);
  }
}
