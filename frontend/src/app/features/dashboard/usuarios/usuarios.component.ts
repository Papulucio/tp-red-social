import { Component, OnInit, inject, signal } from '@angular/core';
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
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Perfil, User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { extraerMensajeError } from '../../../core/utils/error-message';
import {
  passwordValidator,
  passwordsCoinciden,
} from '../../../core/validators/password.validator';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import { EstadoUsuarioPipe } from '../../../shared/pipes/estado-usuario.pipe';
import { ResaltarEstadoDirective } from '../../../shared/directives/resaltar-estado.directive';
import { ImagenFallbackDirective } from '../../../shared/directives/imagen-fallback.directive';
import { urlImagen } from '../../../core/utils/asset-url';

@Component({
  selector: 'app-usuarios',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    EstadoUsuarioPipe,
    ResaltarEstadoDirective,
    ImagenFallbackDirective,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly notificacion = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  readonly usuarios = signal<User[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly ocultarPassword = signal(true);
  readonly ocultarRepetir = signal(true);
  readonly previsualizacion = signal<string | null>(null);
  readonly columnas = ['usuario', 'correo', 'perfil', 'estado', 'acciones'];
  readonly urlImagen = urlImagen;

  private archivo: File | null = null;

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.maxLength(60)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.]{3,20}$/)],
      ],
      password: ['', [Validators.required, passwordValidator]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(200)]],
      perfil: ['usuario' as Perfil, [Validators.required]],
    },
    { validators: passwordsCoinciden },
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.userService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
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

  crearUsuario(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificacion.error('Revisá los datos del formulario');
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();
    const formData = new FormData();
    formData.append('nombre', v.nombre);
    formData.append('apellido', v.apellido);
    formData.append('correo', v.correo);
    formData.append('nombreUsuario', v.nombreUsuario);
    formData.append('password', v.password);
    formData.append('fechaNacimiento', v.fechaNacimiento);
    formData.append('descripcion', v.descripcion ?? '');
    formData.append('perfil', v.perfil);
    if (this.archivo) formData.append('imagenPerfil', this.archivo);

    this.userService.crear(formData).subscribe({
      next: (usuario) => {
        this.guardando.set(false);
        this.usuarios.update((lista) => [usuario, ...lista]);
        this.form.reset({
          nombre: '',
          apellido: '',
          correo: '',
          nombreUsuario: '',
          password: '',
          repetirPassword: '',
          fechaNacimiento: '',
          descripcion: '',
          perfil: 'usuario',
        });
        this.archivo = null;
        this.previsualizacion.set(null);
        this.notificacion.success('Usuario creado correctamente');
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.notificacion.error(extraerMensajeError(error));
      },
    });
  }

  cambiarEstado(usuario: User): void {
    const activo = usuario.activo !== false;
    const accion = activo ? 'deshabilitar' : 'habilitar';
    this.confirmService
      .abrir({
        titulo: activo ? 'Deshabilitar usuario' : 'Habilitar usuario',
        mensaje: `¿Seguro que querés ${accion} a @${usuario.nombreUsuario}?`,
        textoConfirmar: activo ? 'Deshabilitar' : 'Habilitar',
        peligro: activo,
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        const peticion = activo
          ? this.userService.deshabilitar(usuario._id)
          : this.userService.habilitar(usuario._id);
        peticion.subscribe({
          next: (actualizado) => {
            this.usuarios.update((lista) =>
              lista.map((u) => (u._id === actualizado._id ? actualizado : u)),
            );
            this.notificacion.success(
              activo ? 'Usuario deshabilitado' : 'Usuario habilitado',
            );
          },
          error: (error: unknown) =>
            this.notificacion.error(extraerMensajeError(error)),
        });
      });
  }
}
