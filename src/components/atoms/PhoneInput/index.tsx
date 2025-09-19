import React, { forwardRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber, Country } from 'react-phone-number-input';
import { cn } from '@/utils/cn';
import { ChevronDownIcon } from 'lucide-react';

// Importamos los estilos base y nuestros estilos personalizados
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  defaultCountry?: Country;
  error?: boolean;
}

// Componente personalizado para el input que mantenga nuestro estilo
const CustomInput = forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

CustomInput.displayName = 'CustomInput';

// Componente personalizado para el selector de país
const CustomCountrySelect = ({ value, onChange, options, ...rest }: any) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="bg-background border-gray-300 focus:ring-ring flex h-10 w-20 rounded-l-md border border-r-0 px-2 py-2 text-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      >
        {options.map(({ value, label }: any) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
};

export const PhoneInputComponent = ({
  value,
  onChange,
  placeholder = "Ingrese número de teléfono",
  disabled = false,
  className,
  defaultCountry = "AR", // Argentina por defecto
  error = false,
}: PhoneInputProps) => {
  return (
    <div className={cn("relative", className)}>
      <PhoneInput
        value={value}
        onChange={onChange}
        defaultCountry={defaultCountry}
        placeholder={placeholder}
        disabled={disabled}
        inputComponent={CustomInput}
        countrySelectComponent={CustomCountrySelect}
        className={cn(
          "PhoneInput",
          error && "border-red-500"
        )}
        international
        countryCallingCodeEditable={false}
        style={{
          '--PhoneInput-color--focus': '#3b82f6',
        } as React.CSSProperties}
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
