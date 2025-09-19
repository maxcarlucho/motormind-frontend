import Spinner from '@/components/atoms/Spinner';
import { Diagnosis } from '@/types/Diagnosis';
import { useApi } from '@/hooks/useApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useEffect } from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { AppointmentDiagnosisItem } from './AppointmentDiagnosisItem';
import apiService from '@/service/api.service';

interface AppointmentDiagnosisHistoryProps {
  appointmentId: string;
  carId: string;
}

const AppointmentDiagnosisHistory = ({ carId }: AppointmentDiagnosisHistoryProps) => {
  const queryClient = useQueryClient();
  const { execute: getDiagnosesByCarId } = useApi<Diagnosis[]>('get', '/cars/:carId/diagnosis');

  const {
    data: { data: diagnoses = [] } = { data: [] },
    isLoading: isLoadingDiagnoses,
    isError: isErrorDiagnoses,
    error: diagnosesError,
  } = useQuery<{ data: Diagnosis[] }>({
    queryKey: ['getDiagnosesByCarId', carId],
    queryFn: async () => {
      const response = await getDiagnosesByCarId(undefined, undefined, {
        carId: carId,
      });
      return { data: response.data };
    },
    enabled: !!carId,
    staleTime: 60000,
  });

  useEffect(() => {
    if (isErrorDiagnoses) {
      console.log(diagnosesError);
      enqueueSnackbar('Error al cargar diagnósticos', { variant: 'error' });
    }
  }, [isErrorDiagnoses, diagnosesError]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['getDiagnosesByCarId'] });
    };
  }, [carId, queryClient]);

  const handleDeleteDiagnosis = async (diagnosisId: string) => {
    try {
      await apiService.deleteDiagnosis(diagnosisId);
      enqueueSnackbar('Diagnóstico eliminado correctamente', { variant: 'success' });

      // Invalidar múltiples queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['getDiagnosesByCarId'] });
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      queryClient.removeQueries({ queryKey: ['getDiagnosisById', diagnosisId] });
      queryClient.removeQueries({ queryKey: ['diagnosis', diagnosisId] });
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      enqueueSnackbar('Error al eliminar el diagnóstico', { variant: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md mb-3 font-medium sm:text-lg">Diagnósticos Relacionados</h3>

      {isLoadingDiagnoses ? (
        <div className="mt-4 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col">
          {diagnoses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-3">
                <AlertCircleIcon className="text-muted h-8 w-8" />
              </div>
              <p className="text-muted text-sm sm:text-base">
                No hay diagnósticos registrados para esta cita.
              </p>
            </div>
          )}
          {diagnoses
            .sort((a, b) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((diagnosis: Diagnosis, index: number) => (
              <div
                key={diagnosis._id}
                className="overflow-hidden border border-gray-200 first:rounded-t-lg last:rounded-b-lg"
              >
                <AppointmentDiagnosisItem
                  diagnosis={diagnosis}
                  index={index}
                  onDelete={handleDeleteDiagnosis}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentDiagnosisHistory;
