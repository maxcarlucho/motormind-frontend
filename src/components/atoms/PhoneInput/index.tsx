import React, { useCallback, useMemo } from 'react';
import PhoneInput from 'react-phone-number-input';
import { Country } from 'react-phone-number-input';
import { cn } from '@/utils/cn';

// Importamos los estilos base y nuestros estilos personalizados
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

// Importamos las traducciones en español
import es from 'react-phone-number-input/locale/es.json';

interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  defaultCountry?: Country;
  error?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  onBlur?: () => void;
}

export const PhoneInputComponent = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  defaultCountry = 'AR',
  error = false,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  onBlur,
}: PhoneInputProps) => {
  // Generar placeholder dinámico basado en el país
  const dynamicPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;

    // Placeholders específicos por país
    const countryPlaceholders: Record<string, string> = {
      AR: '11 1234-5678',
      US: '(555) 123-4567',
      ES: '612 345 678',
      MX: '55 1234 5678',
      BR: '11 91234-5678',
      CL: '9 1234 5678',
      CO: '300 123 4567',
      PE: '987 654 321',
      UY: '99 123 456',
      PY: '981 123 456',
      BO: '7 123 4567',
      EC: '99 123 4567',
      VE: '412 123 4567',
      GT: '5 123 4567',
      CR: '8 123 4567',
      PA: '6 123 4567',
      DO: '809 123 4567',
      CU: '5 123 4567',
      HN: '9 123 4567',
      NI: '8 123 4567',
      SV: '7 123 4567',
    };

    return countryPlaceholders[defaultCountry] || 'Ej: +54911...';
  }, [defaultCountry, placeholder]);

  // Sanitizar valor pegado
  const sanitizePastedValue = useCallback((pastedValue: string): string => {
    // Mantener solo + inicial y dígitos
    const sanitized = pastedValue.replace(/[^\d+]/g, '');

    // Asegurar que solo hay un + al inicio
    if (sanitized.startsWith('+')) {
      return '+' + sanitized.slice(1).replace(/[^\d]/g, '');
    }

    return sanitized.replace(/[^\d]/g, '');
  }, []);

  // Manejar cambio de valor
  const handleChange = useCallback(
    (phoneValue: string | undefined) => {
      if (!phoneValue) {
        onChange(phoneValue);
        return;
      }

      // El componente ya maneja la limitación de longitud con limitMaxLength
      // Solo sanitizamos si es necesario
      const sanitized = sanitizePastedValue(phoneValue);
      onChange(sanitized || phoneValue);
    },
    [onChange, sanitizePastedValue],
  );

  // Manejar pegado
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const sanitized = sanitizePastedValue(pastedText);

      if (sanitized) {
        handleChange(sanitized);
      }
    },
    [handleChange, sanitizePastedValue],
  );

  // Manejar teclas
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key, ctrlKey, metaKey } = e;

    // Permitir teclas de control
    if (
      ctrlKey ||
      metaKey ||
      [
        'Backspace',
        'Delete',
        'Tab',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(key)
    ) {
      return;
    }

    // Permitir + solo al inicio
    if (key === '+') {
      const input = e.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;
      const currentValue = input.value || '';

      if (cursorPosition === 0 && !currentValue.startsWith('+')) {
        return;
      }
    }

    // Permitir solo dígitos
    if (!/^\d$/.test(key)) {
      e.preventDefault();
    }
  }, []);

  return (
    <div className={cn('phone-field', className)}>
      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={handleChange}
        placeholder={dynamicPlaceholder}
        disabled={disabled}
        countryCallingCodeEditable={false}
        smartCaret
        limitMaxLength
        labels={es}
        className={cn('phone-input', error && 'phone-input--error')}
        numberInputProps={{
          id,
          inputMode: 'numeric',
          autoComplete: 'tel',
          'aria-label': 'Teléfono (WhatsApp)',
          'aria-invalid': ariaInvalid || error,
          'aria-describedby': ariaDescribedby,
          onPaste: handlePaste,
          onKeyDown: handleKeyDown,
          onBlur,
        }}
      />
    </div>
  );
};

// Re-exportar el hook desde el archivo separado
export { usePhoneValidation } from './usePhoneValidation';
