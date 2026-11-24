import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImagenFallback]',
  standalone: true,
})
export class ImagenFallbackDirective {
  @Input() appImagenFallback =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="%23e0e0e0"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666">Sin imagen</text></svg>';

  @HostListener('error', ['$event'])
  onError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img || img.src === this.appImagenFallback) return;
    img.src = this.appImagenFallback;
  }
}
