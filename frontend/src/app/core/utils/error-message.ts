import { HttpErrorResponse } from '@angular/common/http';

export function extraerMensajeError(
  error: unknown,
  porDefecto = 'Ocurrió un error inesperado. Intentá nuevamente.',
): string {
  if (error instanceof HttpErrorResponse) {
    const mensaje = error.error?.message;
    if (Array.isArray(mensaje)) {
      return mensaje.join('. ');
    }
    if (typeof mensaje === 'string' && mensaje.length > 0) {
      return mensaje;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return porDefecto;
  }
  return porDefecto;
}
