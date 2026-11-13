import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) {
    return null;
  }
  const errores: ValidationErrors = {};
  if (valor.length < 8) {
    errores['largo'] = true;
  }
  if (!/[A-Z]/.test(valor)) {
    errores['mayuscula'] = true;
  }
  if (!/\d/.test(valor)) {
    errores['numero'] = true;
  }
  return Object.keys(errores).length > 0 ? errores : null;
}

export function passwordsCoinciden(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repetir = control.get('repetirPassword')?.value;
  if (password && repetir && password !== repetir) {
    control.get('repetirPassword')?.setErrors({ noCoinciden: true });
    return { noCoinciden: true };
  }
  return null;
}
