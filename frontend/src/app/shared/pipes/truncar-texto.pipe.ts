import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncarTexto',
  standalone: true,
})
export class TruncarTextoPipe implements PipeTransform {
  transform(valor: string | null | undefined, limite = 120): string {
    if (!valor) return '';
    if (valor.length <= limite) return valor;
    return `${valor.slice(0, limite).trimEnd()}…`;
  }
}
