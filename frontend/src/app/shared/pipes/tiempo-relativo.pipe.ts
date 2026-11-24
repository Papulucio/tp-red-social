import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tiempoRelativo',
  standalone: true,
})
export class TiempoRelativoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';

    const diffMs = Date.now() - fecha.getTime();
    const diffSeg = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSeg < 60) return 'hace un momento';
    const diffMin = Math.floor(diffSeg / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `hace ${diffHoras} h`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias < 7) return `hace ${diffDias} día${diffDias === 1 ? '' : 's'}`;
    return fecha.toLocaleDateString('es-AR');
  }
}
