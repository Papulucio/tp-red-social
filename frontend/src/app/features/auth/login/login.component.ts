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
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extraerMensajeError } from '../../../core/utils/error-message';
import { passwordValidator } from '../../../core/validators/password.validator';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificacion = inject(NotificationService);

  readonly cargando = signal(false);
  readonly ocultarPassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required, passwordValidator]],
  });

  get identificador() {
    return this.form.controls.identificador;
  }

  get password() {
    return this.form.controls.password;
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const { identificador, password } = this.form.getRawValue();

    this.auth.login(identificador, password).subscribe({
      next: () => {
        this.notificacion.success('¡Bienvenido de vuelta!');
        void this.router.navigate(['/publicaciones']);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.notificacion.error(
          extraerMensajeError(error, 'Credenciales inválidas'),
        );
      },
    });
  }
}
