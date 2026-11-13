import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Post } from '../../core/models/post.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PostService } from '../../core/services/post.service';
import { extraerMensajeError } from '../../core/utils/error-message';
import { PublicacionCardComponent } from './publicacion-card/publicacion-card.component';
import { PublicacionFormDialogComponent } from './publicacion-form-dialog/publicacion-form-dialog.component';

@Component({
  selector: 'app-publicaciones',
  imports: [
    PublicacionCardComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './publicaciones.component.html',
  styleUrl: './publicaciones.component.css',
})
export class PublicacionesComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly dialog = inject(MatDialog);
  private readonly notificacion = inject(NotificationService);
  readonly auth = inject(AuthService);

  readonly publicaciones = signal<Post[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(true);
  readonly orden = signal<'fecha' | 'likes'>('fecha');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.postService
      .listar({
        sort: this.orden(),
        offset: this.pageIndex() * this.pageSize(),
        limit: this.pageSize(),
      })
      .subscribe({
        next: (respuesta) => {
          this.publicaciones.set(respuesta.publicaciones);
          this.total.set(respuesta.total);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.notificacion.error(extraerMensajeError(error));
        },
      });
  }

  cambiarOrden(orden: 'fecha' | 'likes'): void {
    if (this.orden() === orden) {
      return;
    }
    this.orden.set(orden);
    this.pageIndex.set(0);
    this.cargar();
  }

  alCambiarPagina(evento: PageEvent): void {
    this.pageIndex.set(evento.pageIndex);
    this.pageSize.set(evento.pageSize);
    this.cargar();
  }

  abrirCrear(): void {
    this.dialog
      .open(PublicacionFormDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((post?: Post) => {
        if (post) {
          this.notificacion.success('Publicación creada');
          this.pageIndex.set(0);
          this.cargar();
        }
      });
  }

  actualizar(publicacion: Post): void {
    this.publicaciones.update((lista) =>
      lista.map((p) => (p._id === publicacion._id ? publicacion : p)),
    );
  }

  eliminar(id: string): void {
    this.publicaciones.update((lista) => lista.filter((p) => p._id !== id));
    this.total.update((total) => Math.max(0, total - 1));

    if (this.publicaciones().length === 0 && this.pageIndex() > 0) {
      this.pageIndex.update((indice) => indice - 1);
      this.cargar();
    }
  }
}
