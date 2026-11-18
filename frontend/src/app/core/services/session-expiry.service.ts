import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SessionService } from './session.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';

@Injectable({ providedIn: 'root' })
export class SessionExpiryService {
  private readonly session = inject(SessionService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);
  private readonly notificacion = inject(NotificationService);

  constructor() {
    this.session.advertencia$.subscribe(() => this.abrir());
  }

  private abrir(): void {
    this.confirm
      .abrir({
        titulo: 'Tu sesión está por expirar',
        mensaje: 'Tu sesión expirará en 5 minutos. ¿Querés extenderla?',
        textoConfirmar: 'Extender sesión',
        textoCancelar: 'Dejar que expire',
      })
      .subscribe((extender) => {
        if (!extender) {
          this.session.programarExpiracionFinal();
          return;
        }

        this.auth.refrescar().subscribe({
          next: () => this.notificacion.success('Sesión extendida'),
          error: () => this.session.programarExpiracionFinal(),
        });
      });
  }
}
