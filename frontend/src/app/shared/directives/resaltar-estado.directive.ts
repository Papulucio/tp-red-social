import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[appResaltarEstado]',
  standalone: true,
})
export class ResaltarEstadoDirective {
  @Input() appResaltarEstado: boolean | null | undefined = true;

  @HostBinding('style.backgroundColor')
  get backgroundColor(): string | null {
    return this.appResaltarEstado === false ? 'rgba(244, 67, 54, 0.08)' : null;
  }

  @HostBinding('style.opacity')
  get opacity(): string | null {
    return this.appResaltarEstado === false ? '0.85' : null;
  }
}
