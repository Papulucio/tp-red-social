import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const ADVERTENCIA_MS = 10 * 60 * 1000;
const EXPIRACION_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly advertencia = new Subject<void>();
  private readonly expirado = new Subject<void>();
  private timerAdvertencia: ReturnType<typeof setTimeout> | null = null;
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;

  readonly advertencia$ = this.advertencia.asObservable();
  readonly expirado$ = this.expirado.asObservable();

  start(): void {
    this.clear();
    this.timerAdvertencia = setTimeout(() => {
      this.timerAdvertencia = null;
      this.advertencia.next();
    }, ADVERTENCIA_MS);
  }

  programarExpiracionFinal(): void {
    this.limpiarAdvertencia();
    this.limpiarExpiracion();
    this.timerExpiracion = setTimeout(() => {
      this.timerExpiracion = null;
      this.expirado.next();
    }, EXPIRACION_MS);
  }

  clear(): void {
    this.limpiarAdvertencia();
    this.limpiarExpiracion();
  }

  private limpiarAdvertencia(): void {
    if (this.timerAdvertencia !== null) {
      clearTimeout(this.timerAdvertencia);
      this.timerAdvertencia = null;
    }
  }

  private limpiarExpiracion(): void {
    if (this.timerExpiracion !== null) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }
  }
}
