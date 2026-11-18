import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    service.clear();
    vi.useRealTimers();
  });

  it('avisa a los 10 minutos de iniciar la sesión', () => {
    const aviso = vi.fn();
    service.advertencia$.subscribe(aviso);

    service.start();
    vi.advanceTimersByTime(10 * 60 * 1000 - 1);
    expect(aviso).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('programa la expiración 5 minutos después de rechazar la extensión', () => {
    const expiracion = vi.fn();
    service.expirado$.subscribe(expiracion);

    service.start();
    service.programarExpiracionFinal();
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    expect(expiracion).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(expiracion).toHaveBeenCalledTimes(1);
  });

  it('cancela los temporizadores al limpiar', () => {
    const aviso = vi.fn();
    const expiracion = vi.fn();
    service.advertencia$.subscribe(aviso);
    service.expirado$.subscribe(expiracion);

    service.start();
    service.clear();
    vi.advanceTimersByTime(20 * 60 * 1000);

    expect(aviso).not.toHaveBeenCalled();
    expect(expiracion).not.toHaveBeenCalled();
  });
});
