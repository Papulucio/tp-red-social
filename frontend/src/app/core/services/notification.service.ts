import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3500,
      panelClass: 'snack-success',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: 'snack-error',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  info(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3500,
      panelClass: 'snack-info',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
