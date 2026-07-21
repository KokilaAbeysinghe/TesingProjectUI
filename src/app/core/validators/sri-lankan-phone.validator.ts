import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const SRI_LANKAN_PHONE_PATTERN = /^(?:\+94|0)[0-9]{9}$/;

export function sriLankanPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;

    if (!value) {
      return null;
    }

    const normalizedValue = value.replace(/[\s-]/g, '');

    return SRI_LANKAN_PHONE_PATTERN.test(normalizedValue) ? null : { sriLankanPhone: true };
  };
}
