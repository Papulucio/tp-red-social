import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoUsuario',
  standalone: true,
})
export class EstadoUsuarioPipe implements PipeTransform {
  transform(activo: boolean | null | undefined): string {
    return activo === false ? 'Deshabilitado' : 'Activo';
  }
}
