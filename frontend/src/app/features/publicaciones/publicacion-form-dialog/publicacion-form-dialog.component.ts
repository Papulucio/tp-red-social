import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Post } from '../../../core/models/post.model';
import { NotificationService } from '../../../core/services/notification.service';
import { PostService } from '../../../core/services/post.service';
import { extraerMensajeError } from '../../../core/utils/error-message';

@Component({
  selector: 'app-publicacion-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './publicacion-form-dialog.component.html',
  styleUrl: './publicacion-form-dialog.component.css',
})
export class PublicacionFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<PublicacionFormDialogComponent>,
  );
  private readonly postService = inject(PostService);
  private readonly notificacion = inject(NotificationService);

  readonly cargando = signal(false);
  readonly previsualizacion = signal<string | null>(null);

  private archivo: File | null = null;

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    mensaje: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  get titulo() {
    return this.form.controls.titulo;
  }
  get mensaje() {
    return this.form.controls.mensaje;
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !file.type.startsWith('image/')) {
      this.notificacion.error('El archivo debe ser una imagen');
      input.value = '';
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      this.notificacion.error('La imagen no puede superar los 5 MB');
      input.value = '';
      return;
    }

    this.archivo = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.previsualizacion.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previsualizacion.set(null);
    }
  }

  quitarImagen(input: HTMLInputElement): void {
    this.archivo = null;
    this.previsualizacion.set(null);
    input.value = '';
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const { titulo, mensaje } = this.form.getRawValue();

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('mensaje', mensaje);
    if (this.archivo) {
      formData.append('imagen', this.archivo);
    }

    this.postService.crear(formData).subscribe({
      next: (post: Post) => this.dialogRef.close(post),
      error: (error: unknown) => {
        this.cargando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }
}
