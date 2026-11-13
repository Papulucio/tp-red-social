import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Post } from '../../core/models/post.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PostService } from '../../core/services/post.service';
import { UserService } from '../../core/services/user.service';
import { urlImagen } from '../../core/utils/asset-url';
import { extraerMensajeError } from '../../core/utils/error-message';
import { PublicacionCardComponent } from '../publicaciones/publicacion-card/publicacion-card.component';
import { PerfilFormDialogComponent } from './perfil-form-dialog/perfil-form-dialog.component';

@Component({
  selector: 'app-mi-perfil',
  imports: [
    DatePipe,
    PublicacionCardComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css',
})
export class MiPerfilComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly postService = inject(PostService);
  private readonly dialog = inject(MatDialog);
  private readonly notificacion = inject(NotificationService);

  readonly usuario = this.auth.currentUser;
  readonly urlImagen = urlImagen;
  readonly publicaciones = signal<Post[]>([]);
  readonly cargando = signal(true);

  ngOnInit(): void {
    const usuario = this.usuario();
    if (!usuario) {
      return;
    }

    this.userService.obtener(usuario._id).subscribe({
      next: (actualizado) => this.auth.updateCurrentUser(actualizado),
      error: () => undefined,
    });

    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    const usuario = this.usuario();
    if (!usuario) {
      return;
    }
    this.cargando.set(true);
    this.postService
      .listar({ userId: usuario._id, sort: 'fecha', limit: 3, offset: 0 })
      .subscribe({
        next: (respuesta) => {
          this.publicaciones.set(respuesta.publicaciones);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.notificacion.error(extraerMensajeError(error));
        },
      });
  }

  abrirEditar(): void {
    const usuario = this.usuario();
    if (!usuario) {
      return;
    }
    this.dialog
      .open(PerfilFormDialogComponent, {
        data: usuario,
        width: '560px',
        maxWidth: '95vw',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((actualizado?: User) => {
        if (actualizado) {
          this.auth.updateCurrentUser(actualizado);
          this.notificacion.success('Perfil actualizado');
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
  }
}
