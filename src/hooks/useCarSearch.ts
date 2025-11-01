/**
 * Hook para búsqueda y creación de coches por matrícula o VIN
 * Replica la lógica del flujo original de diagnósticos
 */

import { useState } from 'react';
import { ApiService } from '@/service/api.service';
import { Car } from '@/types/Car';

interface UseCarSearchResult {
  searchCar: (query: { plate?: string; vinCode?: string }) => Promise<Car>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}



export const useCarSearch = (): UseCarSearchResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const searchCar = async (query: { plate?: string; vinCode?: string }): Promise<Car> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!query.plate && !query.vinCode) {
        throw new Error('Se requiere matrícula o VIN');
      }

      console.log('🔍 Buscando/creando coche:', query);

      // Llamar al endpoint de búsqueda/creación
      const apiService = ApiService.getInstance();
      const response = await apiService.get<Car>('/cars/vin-or-plate', {
        params: query
      });

      console.log('✅ Coche encontrado/creado:', response.data);
      return response.data;

    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al buscar el coche';
      console.error('❌ Error buscando coche:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchCar,
    isLoading,
    error,
    clearError,
  };
};
