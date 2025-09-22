import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber, Country, parsePhoneNumber } from 'react-phone-number-input';
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
}

// Función para obtener la longitud máxima de dígitos por país
const getMaxDigitsForCountry = (country: Country): number => {
  const maxDigitsByCountry: Record<string, number> = {
    AR: 10, // Argentina: 11 1234-5678 (10 dígitos)
    US: 10, // Estados Unidos: (555) 123-4567 (10 dígitos)
    ES: 9, // España: 612 345 678 (9 dígitos)
    MX: 10, // México: 55 1234 5678 (10 dígitos)
    BR: 11, // Brasil: 11 91234-5678 (11 dígitos)
    CL: 9, // Chile: 9 1234 5678 (9 dígitos)
    CO: 10, // Colombia: 300 123 4567 (10 dígitos)
    PE: 9, // Perú: 987 654 321 (9 dígitos)
    UY: 8, // Uruguay: 99 123 456 (8 dígitos)
    PY: 9, // Paraguay: 981 123 456 (9 dígitos)
    BO: 8, // Bolivia: 7 123 4567 (8 dígitos)
    EC: 9, // Ecuador: 99 123 4567 (9 dígitos)
    VE: 10, // Venezuela: 412 123 4567 (10 dígitos)
    GT: 8, // Guatemala: 5 123 4567 (8 dígitos)
    CR: 8, // Costa Rica: 8 123 4567 (8 dígitos)
    PA: 8, // Panamá: 6 123 4567 (8 dígitos)
    DO: 10, // República Dominicana: 809 123 4567 (10 dígitos)
    CU: 8, // Cuba: 5 123 4567 (8 dígitos)
    HN: 8, // Honduras: 9 123 4567 (8 dígitos)
    NI: 8, // Nicaragua: 8 123 4567 (8 dígitos)
    SV: 8, // El Salvador: 7 123 4567 (8 dígitos)
  };

  return maxDigitsByCountry[country] || 15; // Default a 15 si no está definido
};

export const PhoneInputComponent = ({
  value,
  onChange,
  placeholder = 'Ingrese número de teléfono',
  disabled = false,
  className,
  defaultCountry = 'AR', // Argentina por defecto
  error = false,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: PhoneInputProps) => {
  const handleChange = (phoneValue: string | undefined) => {
    if (!phoneValue) {
      onChange(phoneValue);
      return;
    }

    // Extraer solo los dígitos del número
    const digitsOnly = phoneValue.replace(/\D/g, '');

    // Obtener el país del número o usar el default
    let country: Country = defaultCountry;
    try {
      const phoneNumber = parsePhoneNumber(phoneValue);
      if (phoneNumber?.country) {
        country = phoneNumber.country;
      }
    } catch {
      // Si no se puede parsear, usar el país por defecto
    }

    // Obtener la longitud máxima para el país
    const maxDigits = getMaxDigitsForCountry(country);

    // Limitar a la longitud máxima
    if (digitsOnly.length > maxDigits) {
      // No permitir más dígitos de los permitidos
      return;
    }

    onChange(phoneValue);
  };

  return (
    <div className={cn('phone-field', className)}>
      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        countryCallingCodeEditable={false}
        labels={es}
        className={cn('phone-input', error && 'phone-input--error')}
        // Formateo automático mientras el usuario escribe
        format={(value: string, country: Country) => {
          if (!value) return '';
          try {
            const phoneNumber = parsePhoneNumber(value, country);
            if (phoneNumber) {
              // Formatear según el país seleccionado
              return phoneNumber.formatNational();
            }
          } catch {
            // Si hay error en el parsing, devolver el valor original
          }
          return value;
        }}
        inputProps={{
          id,
          type: 'tel',
          autoComplete: 'tel',
          'aria-invalid': ariaInvalid || error,
          'aria-describedby': ariaDescribedby,
          // Limitar caracteres a solo números y algunos símbolos
          pattern: '[0-9+\\s\\-\\(\\)]*',
        }}
      />
    </div>
  );
};

// Hook de validación
export const usePhoneValidation = () => {
  const validatePhone = (phone: string | undefined): boolean => {
    if (!phone) return false;
    return isValidPhoneNumber(phone);
  };

  const formatPhone = (phone: string | undefined): string | undefined => {
    if (!phone) return undefined;
    return phone; // react-phone-number-input ya formatea automáticamente
  };

  return { validatePhone, formatPhone };
};
