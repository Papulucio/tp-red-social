import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { Comentario, Post } from '../../../core/models/post.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PostService } from '../../../core/services/post.service';
import { extraerMensajeError } from '../../../core/utils/error-message';
import { PublicacionCardComponent } from '../publicacion-card/publicacion-card.component';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PublicacionCardComponent,
  ],
  templateUrl: './publicacion-detalle.component.html',
  styleUrl: './publicacion-detalle.component.css',
})
export class PublicacionDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly notificacion = inject(NotificationService);
  readonly auth = inject(AuthService);

  private readonly limite = 5;
  private publicacionId = '';

  readonly post = signal<Post | null>(null);
  readonly comentarios = signal<Comentario[]>([]);
  readonly total = signal(0);
  readonly offset = signal(0);
  readonly hasMore = signal(false);
  readonly cargando = signal(true);
  readonly cargandoMas = signal(false);
  readonly enviando = signal(false);
  readonly nuevoComentario = signal('');
  readonly editandoId = signal<string | null>(null);
  readonly textoEdicion = signal('');
  readonly guardandoEdicion = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((params) => {
          this.publicacionId = params.get('id') ?? '';
          this.cargando.set(true);
          return forkJoin({
            post: this.postService.obtener(this.publicacionId),
            comentarios: this.postService.listarComentarios(this.publicacionId, {
              offset: 0,
              limit: this.limite,
            }),
          });
        }),
      )
      .subscribe({
        next: ({ post, comentarios }) => {
          this.post.set(post);
          this.comentarios.set(comentarios.comentarios);
          this.total.set(comentarios.total);
          this.offset.set(comentarios.offset + comentarios.comentarios.length);
          this.hasMore.set(comentarios.hasMore);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.notificacion.error(extraerMensajeError(error));
        },
      });
  }

  nombreAutor(comentario: Comentario): string {
    if (typeof comentario.autor === 'string') {
      return 'Usuario';
    }
    return (
      `${comentario.autor.nombre} ${comentario.autor.apellido}`.trim() ||
      comentario.autor.nombreUsuario
    );
  }

  usuarioAutor(comentario: Comentario): string {
    if (typeof comentario.autor === 'string') {
      return '';
    }
    return `@${comentario.autor.nombreUsuario}`;
  }

  puedeEditar(comentario: Comentario): boolean {
    const usuario = this.auth.currentUser();
    if (!usuario) {
      return false;
    }
    const autor =
      typeof comentario.autor === 'string'
        ? comentario.autor
        : comentario.autor._id;
    return autor === usuario._id;
  }

  cargarMas(): void {
    if (!this.hasMore() || this.cargandoMas() || !this.publicacionId) {
      return;
    }

    this.cargandoMas.set(true);
    this.postService
      .listarComentarios(this.publicacionId, {
        offset: this.offset(),
        limit: this.limite,
      })
      .subscribe({
        next: (respuesta) => {
          this.comentarios.update((actuales) => [
            ...actuales,
            ...respuesta.comentarios,
          ]);
          this.offset.update((valor) => valor + respuesta.comentarios.length);
          this.total.set(respuesta.total);
          this.hasMore.set(respuesta.hasMore);
          this.cargandoMas.set(false);
        },
        error: (error: unknown) => {
          this.cargandoMas.set(false);
          this.notificacion.error(extraerMensajeError(error));
        },
      });
  }

  enviarComentario(): void {
    const texto = this.nuevoComentario().trim();
    if (!texto || this.enviando() || !this.publicacionId) {
      return;
    }

    this.enviando.set(true);
    this.postService.comentar(this.publicacionId, texto).subscribe({
      next: (comentario) => {
        this.comentarios.update((actuales) => [comentario, ...actuales]);
        this.total.update((valor) => valor + 1);
        this.offset.update((valor) => valor + 1);
        this.hasMore.set(this.offset() < this.total());
        this.nuevoComentario.set('');
        this.enviando.set(false);
        this.notificacion.success('Comentario agregado');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }

  empezarEdicion(comentario: Comentario): void {
    this.editandoId.set(comentario._id);
    this.textoEdicion.set(comentario.texto);
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.textoEdicion.set('');
  }

  guardarEdicion(comentario: Comentario): void {
    const texto = this.textoEdicion().trim();
    const publicacion = this.post();
    if (
      !texto ||
      !publicacion ||
      this.guardandoEdicion() ||
      !this.puedeEditar(comentario)
    ) {
      return;
    }

    this.guardandoEdicion.set(true);
    this.postService
      .editarComentario(publicacion._id, comentario._id, texto)
      .subscribe({
        next: (actualizado) => {
          this.comentarios.update((actuales) =>
            actuales.map((item) =>
              item._id === actualizado._id ? actualizado : item,
            ),
          );
          this.editandoId.set(null);
          this.textoEdicion.set('');
          this.guardandoEdicion.set(false);
          this.notificacion.success('Comentario actualizado');
        },
        error: (error: unknown) => {
          this.guardandoEdicion.set(false);
          this.notificacion.error(extraerMensajeError(error));
        },
      });
  }

  actualizarPost(post: Post): void {
    this.post.set(post);
  }

  volver(): void {
    void this.router.navigate(['/publicaciones']);
  }
}
