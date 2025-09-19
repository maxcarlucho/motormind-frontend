import Spinner from '@/components/atoms/Spinner';
import { useApi } from '@/hooks/useApi';
import { useSymptom } from '@/hooks/useSymptom';
import { Appointment } from '@/types/Appointment';
import { Diagnosis } from '@/types/Diagnosis';
import { getDiagnosisStatusLabel } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  BrainCircuitIcon,
  CalendarIcon,
  CarIcon,
  ChartBarIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react';

interface AppointmentDiagnosisProps {
  diagnosisId: string;
  appointment: Appointment;
}

const AppointmentDiagnosis: React.FC<AppointmentDiagnosisProps> = ({
  diagnosisId,
  appointment,
}) => {
  const { execute: getDiagnosisById } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');

  const {
    data: { data: diagnosis = {} as Diagnosis } = { data: {} as Diagnosis },
    isLoading,
    isError,
  } = useQuery<{ data: Diagnosis }>({
    queryKey: ['getDiagnosisById', diagnosisId],
    queryFn: async () => {
      const response = await getDiagnosisById(undefined, undefined, {
        diagnosisId: diagnosisId,
      });
      return { data: response.data };
    },
    enabled: !!diagnosisId,
    staleTime: 60000,
    retry: 0,
  });

  const { symptom } = useSymptom(diagnosis);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-blue-100 p-2">
            <BrainCircuitIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h5 className="text-md font-medium sm:text-lg">Diagnóstico relacionado</h5>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !diagnosis._id) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-blue-100 p-2">
            <BrainCircuitIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h5 className="text-md font-medium sm:text-lg">Diagnóstico relacionado</h5>
        </div>
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-3">
            <BrainCircuitIcon className="text-muted h-8 w-8" />
          </div>
          <p className="text-muted text-sm sm:text-base">
            No se encontró un diagnóstico relacionado con esta cita.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
      <h5 className="text-md mb-2 font-medium sm:text-lg">Diagnóstico relacionado</h5>

      <div className="container space-y-2 sm:space-y-0">
        <div className="grids-cols-1 grid gap-2 space-y-1 sm:grid-cols-2 sm:gap-4 sm:space-y-4">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="text-muted mr-2 !h-5 !w-5" />
            <div>
              <p className="text-muted mb-0 text-xs sm:text-sm">Estado del diagnóstico</p>
              <p className="text-sm font-medium sm:text-base">
                {getDiagnosisStatusLabel(diagnosis.status)}
              </p>
            </div>
          </div>

          {/* Información del vehículo */}
          {diagnosis.car && (
            <div className="flex items-center gap-2">
              <CarIcon className="text-muted mr-2 !h-5 !w-5" />
              <div>
                <p className="text-muted mb-0 text-xs sm:text-sm">Vehículo</p>
                <p className="text-sm font-medium sm:text-base">
                  {diagnosis.car.brand} {diagnosis.car.model} (
                  {diagnosis.car.plate || diagnosis.car.vinCode})
                </p>
              </div>
            </div>
          )}

          {/* Fecha de creación */}
          {diagnosis.createdAt && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-muted mr-2 !h-5 !w-5" />
              <div>
                <p className="text-muted mb-0 text-xs sm:text-sm">Fecha de creación</p>
                <p className="text-sm font-medium sm:text-base">
                  {new Date(diagnosis.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          )}

          {/* Creado por */}
          {appointment.createdBy && (
            <div className="flex items-center gap-2">
              <UserIcon className="text-muted mr-2 !h-5 !w-5" />
              <div>
                <p className="text-muted mb-0 text-xs sm:text-sm">Creado por</p>
                <p className="text-sm font-medium sm:text-base">
                  {appointment.createdBy?.name || 'Usuario desconocido'}
                </p>
              </div>
            </div>
          )}

          {/* Posibles razones detectadas */}
          {diagnosis.preliminary?.possibleReasons &&
            diagnosis.preliminary.possibleReasons.length > 0 && (
              <div className="flex items-center gap-2">
                <SearchIcon className="text-muted mr-2 !h-5 !w-5" />
                <div>
                  <p className="text-muted mb-0 text-xs sm:text-sm">Posibles razones</p>
                  <p className="text-sm font-medium sm:text-base">
                    {diagnosis.preliminary.possibleReasons.length} detectadas
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Síntomas reportados - Ocupa toda la fila */}
        {symptom && (
          <div className="mt-4 flex items-start gap-2">
            <AlertTriangleIcon className="text-muted mr-2 !h-5 !w-5" />
            <div className="flex-1">
              <p className="text-muted mb-0 text-xs sm:text-sm">Síntomas reportados</p>
              <p className="text-sm font-medium sm:text-base">{symptom}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentDiagnosis;
