import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AutorResumen, Comentario, Post } from '../../../core/models/post.model';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { PostService } from '../../../core/services/post.service';
import { urlImagen } from '../../../core/utils/asset-url';
import { extraerMensajeError } from '../../../core/utils/error-message';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';

@Component({
  selector: 'app-publicacion-card',
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './publicacion-card.component.html',
  styleUrl: './publicacion-card.component.css',
})
export class PublicacionCardComponent {
  readonly post = input.required<Post>();
  readonly currentUser = input<User | null>(null);

  readonly actualizado = output<Post>();
  readonly eliminado = output<string>();

  private readonly postService = inject(PostService);
  private readonly confirmService = inject(ConfirmService);
  private readonly notificacion = inject(NotificationService);

  readonly urlImagen = urlImagen;

  readonly procesandoLike = signal(false);
  readonly enviandoComentario = signal(false);
  readonly mostrarComentarios = signal(false);
  readonly nuevoComentario = signal('');

  readonly esAutor = computed(() => {
    const usuario = this.currentUser();
    return !!usuario && this.idAutor(this.post().autor) === usuario._id;
  });

  readonly puedeEliminar = computed(() => {
    const usuario = this.currentUser();
    return !!usuario && (this.esAutor() || usuario.perfil === 'administrador');
  });

  readonly dioLike = computed(() => {
    const usuario = this.currentUser();
    return !!usuario && this.post().meGusta.includes(usuario._id);
  });

  idAutor(autor: AutorResumen | string): string {
    return typeof autor === 'string' ? autor : autor._id;
  }

  nombreAutor(autor: AutorResumen | string): string {
    if (typeof autor === 'string') {
      return 'Usuario';
    }
    return `${autor.nombre} ${autor.apellido}`.trim();
  }

  usuarioAutor(autor: AutorResumen | string): string {
    return typeof autor === 'string' ? '' : `@${autor.nombreUsuario}`;
  }

  imagenAutor(autor: AutorResumen | string): string {
    return typeof autor === 'string' ? '' : urlImagen(autor.imagenPerfil);
  }

  inicialesAutor(autor: AutorResumen | string): string {
    if (typeof autor === 'string') {
      return '?';
    }
    return `${autor.nombre.charAt(0)}${autor.apellido.charAt(0)}`.toUpperCase();
  }

  nombreComentario(comentario: Comentario): string {
    return this.nombreAutor(comentario.autor);
  }

  alternarComentarios(): void {
    this.mostrarComentarios.update((valor) => !valor);
  }

  toggleLike(): void {
    if (this.procesandoLike()) {
      return;
    }
    this.procesandoLike.set(true);
    const peticion = this.dioLike()
      ? this.postService.quitarLike(this.post()._id)
      : this.postService.darLike(this.post()._id);

    peticion.subscribe({
      next: (postActualizado) => {
        this.procesandoLike.set(false);
        this.actualizado.emit(postActualizado);
      },
      error: (error: unknown) => {
        this.procesandoLike.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }

  enviarComentario(): void {
    const texto = this.nuevoComentario().trim();
    if (!texto || this.enviandoComentario()) {
      return;
    }
    this.enviandoComentario.set(true);
    this.postService.comentar(this.post()._id, texto).subscribe({
      next: (postActualizado) => {
        this.enviandoComentario.set(false);
        this.nuevoComentario.set('');
        this.mostrarComentarios.set(true);
        this.actualizado.emit(postActualizado);
        this.notificacion.success('Comentario agregado');
      },
      error: (error: unknown) => {
        this.enviandoComentario.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }

  eliminar(): void {
    this.confirmService
      .abrir({
        titulo: 'Eliminar publicación',
        mensaje:
          '¿Seguro que querés eliminar esta publicación? Se dará de baja del feed.',
        textoConfirmar: 'Eliminar',
        peligro: true,
      })
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.postService.eliminar(this.post()._id).subscribe({
          next: () => {
            this.eliminado.emit(this.post()._id);
            this.notificacion.success('Publicación eliminada');
          },
          error: (error: unknown) =>
            this.notificacion.error(extraerMensajeError(error)),
        });
      });
  }
}
