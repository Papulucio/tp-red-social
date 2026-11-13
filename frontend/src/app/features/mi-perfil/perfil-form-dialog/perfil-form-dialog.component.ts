import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { urlImagen } from '../../../core/utils/asset-url';
import { extraerMensajeError } from '../../../core/utils/error-message';

@Component({
  selector: 'app-perfil-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './perfil-form-dialog.component.html',
  styleUrl: './perfil-form-dialog.component.css',
})
export class PerfilFormDialogComponent {
  readonly data = inject<User>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PerfilFormDialogComponent>);
  private readonly userService = inject(UserService);
  private readonly notificacion = inject(NotificationService);

  readonly cargando = signal(false);
  readonly previsualizacion = signal<string | null>(
    urlImagen(this.data.imagenPerfil) || null,
  );

  private archivo: File | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: [this.data.nombre, [Validators.required, Validators.maxLength(60)]],
    apellido: [
      this.data.apellido,
      [Validators.required, Validators.maxLength(60)],
    ],
    descripcion: [this.data.descripcion ?? '', [Validators.maxLength(200)]],
    fechaNacimiento: [
      this.data.fechaNacimiento ? this.data.fechaNacimiento.slice(0, 10) : '',
      [Validators.required],
    ],
  });

  get nombre() {
    return this.form.controls.nombre;
  }
  get apellido() {
    return this.form.controls.apellido;
  }
  get descripcion() {
    return this.form.controls.descripcion;
  }
  get fechaNacimiento() {
    return this.form.controls.fechaNacimiento;
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
    }
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
    const valores = this.form.getRawValue();

    const formData = new FormData();
    formData.append('nombre', valores.nombre);
    formData.append('apellido', valores.apellido);
    formData.append('descripcion', valores.descripcion ?? '');
    formData.append('fechaNacimiento', valores.fechaNacimiento);
    if (this.archivo) {
      formData.append('imagenPerfil', this.archivo);
    }

    this.userService.actualizar(this.data._id, formData).subscribe({
      next: (usuario) => this.dialogRef.close(usuario),
      error: (error: unknown) => {
        this.cargando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }
}
