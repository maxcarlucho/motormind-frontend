import { useCallback } from 'react';
import { 
  isValidPhoneNumber, 
  isPossiblePhoneNumber, 
  Country
} from 'react-phone-number-input';
import es from 'react-phone-number-input/locale/es.json';

// Hook de validación mejorado
export const usePhoneValidation = () => {
  const validatePhone = useCallback((phone: string | undefined): boolean => {
    if (!phone) return false;
    return isValidPhoneNumber(phone);
  }, []);

  const isPossiblePhone = useCallback((phone: string | undefined): boolean => {
    if (!phone) return false;
    return isPossiblePhoneNumber(phone);
  }, []);

  const getValidationError = useCallback((phone: string | undefined, country?: Country): string | null => {
    if (!phone) return 'El teléfono es obligatorio';
    
    if (!isPossiblePhoneNumber(phone)) {
      const countryName = country ? es[country] || country : 'el país seleccionado';
      return `Número incompleto para ${countryName}`;
    }
    
    if (!isValidPhoneNumber(phone)) {
      return 'Ingresá un número de teléfono válido';
    }
    
    return null;
  }, []);

  return { 
    validatePhone, 
    isPossiblePhone, 
    getValidationError 
  };
};
