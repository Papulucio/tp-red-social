import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extraerMensajeError } from '../../../core/utils/error-message';
import {
  passwordValidator,
  passwordsCoinciden,
} from '../../../core/validators/password.validator';

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificacion = inject(NotificationService);

  readonly cargando = signal(false);
  readonly ocultarPassword = signal(true);
  readonly ocultarRepetir = signal(true);
  readonly previsualizacion = signal<string | null>(null);

  private archivo: File | null = null;

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.maxLength(60)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9_.]{3,20}$/),
        ],
      ],
      password: ['', [Validators.required, passwordValidator]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(200)]],
    },
    { validators: passwordsCoinciden },
  );

  get nombre() {
    return this.form.controls.nombre;
  }
  get apellido() {
    return this.form.controls.apellido;
  }
  get correo() {
    return this.form.controls.correo;
  }
  get nombreUsuario() {
    return this.form.controls.nombreUsuario;
  }
  get password() {
    return this.form.controls.password;
  }
  get repetirPassword() {
    return this.form.controls.repetirPassword;
  }
  get fechaNacimiento() {
    return this.form.controls.fechaNacimiento;
  }
  get descripcion() {
    return this.form.controls.descripcion;
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

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificacion.error('Revisá los datos del formulario');
      return;
    }

    this.cargando.set(true);
    const valores = this.form.getRawValue();

    const formData = new FormData();
    formData.append('nombre', valores.nombre);
    formData.append('apellido', valores.apellido);
    formData.append('correo', valores.correo);
    formData.append('nombreUsuario', valores.nombreUsuario);
    formData.append('password', valores.password);
    formData.append('fechaNacimiento', valores.fechaNacimiento);
    formData.append('descripcion', valores.descripcion ?? '');
    if (this.archivo) {
      formData.append('imagenPerfil', this.archivo);
    }

    this.auth.registro(formData).subscribe({
      next: () => {
        this.notificacion.success('¡Cuenta creada con éxito!');
        void this.router.navigate(['/publicaciones']);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }
}
