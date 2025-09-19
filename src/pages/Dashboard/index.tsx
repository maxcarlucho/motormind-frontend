import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, PlusIcon, CalendarPlus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { diagnosisLink, formatDate } from '@/utils';
import { Diagnosis } from '@/types/Diagnosis';
import { useApi } from '@/hooks/useApi';
import { DiagnosticListItem } from '@/components/molecules/DiagnosticListItem';
import { DIAGNOSIS_STATUS } from '@/constants';
import Spinner from '@/components/atoms/Spinner';
import { CreateDiagnosticModal } from '@/components/organisms/CreateDiagnosticModal';
import { CreatePreAppointmentModal } from '@/components/molecules/CreatePreAppointmentModal';
import { Button } from '@/components/atoms/Button';
import { FloatingButton } from '@/components/atoms/FloatingButton';
import apiService from '@/service/api.service';

const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreAppointmentModalOpen, setIsPreAppointmentModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { execute: getDiagnosesRequest } = useApi<{ data: Diagnosis[] }>('get', '/diagnoses');

  const {
    data: { data: diagnoses = [] } = { data: [] },
    isLoading: isLoadingDiagnoses,
    isError,
    error,
  } = useQuery<{ data: Diagnosis[] }>({
    queryKey: ['diagnoses'],
    queryFn: async () => {
      const response = await getDiagnosesRequest(undefined, { totalLimit: 5 }, undefined);

      return response.data;
    },
    enabled: true,
    staleTime: 60000,
    retry: false,
  });

  useEffect(() => {
    if (isError && error) {
      enqueueSnackbar(`Error: No se pudieron obtener los diagnósticos`, { variant: 'error' });
    }
  }, [isError, error]);

  const handleDeleteDiagnosis = async (diagnosisId: string) => {
    try {
      await apiService.deleteDiagnosis(diagnosisId);
      enqueueSnackbar('Diagnóstico eliminado correctamente', { variant: 'success' });

      // Invalidar múltiples queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      queryClient.invalidateQueries({ queryKey: ['getDiagnosesByCarId'] });
      queryClient.removeQueries({ queryKey: ['getDiagnosisById', diagnosisId] });
      queryClient.removeQueries({ queryKey: ['diagnosis', diagnosisId] });
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      enqueueSnackbar('Error al eliminar el diagnóstico', { variant: 'error' });
    }
  };

  return (
    <div className="flex flex-grow flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 flex w-full flex-row items-center justify-between bg-white px-4 py-2 shadow-xs sm:px-8 sm:py-4">
        <div className="flex-1 text-center sm:text-left lg:w-auto">
          <h1 className="truncate py-0.5 text-xl font-semibold sm:py-0 lg:text-2xl">Panel</h1>
          <p className="text-muted hidden xl:block">Gestiona y revisa el estado del taller</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Button
            onClick={() => setIsPreAppointmentModalOpen(true)}
            variant="outline"
            className="h-8 w-8 sm:h-auto sm:w-auto"
          >
            <CalendarPlus className="!h-5 !w-5" />
            <span className="hidden lg:inline">Crear pre-cita</span>
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-8 w-8 sm:h-auto sm:w-auto"
          >
            <PlusIcon className="!h-5 !w-5" />
            <span className="hidden lg:inline">Nuevo diagnóstico</span>
          </Button>
        </div>
      </div>

      <main className="flex flex-col">
        <div className="p-2 sm:px-4">
          <div className="m-2 sm:m-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h2 className="text-base font-bold sm:text-lg lg:text-xl">Diagnósticos Recientes</h2>
              <Link to="/diagnoses" className="text-primary text-sm sm:text-base sm:font-medium">
                Ver todos
              </Link>
            </div>

            {isLoadingDiagnoses ? (
              <div className="flex items-center justify-center">
                <Spinner className="mt-5" />
              </div>
            ) : diagnoses.length > 0 ? (
              <div className="mt-5 sm:mt-0">
                {diagnoses
                  .filter(
                    (diagnosis) =>
                      diagnosis.status !== DIAGNOSIS_STATUS.WHATSAPP_AWAITING_QUESTIONS &&
                      diagnosis.status !== DIAGNOSIS_STATUS.WHATSAPP_AWAITING_SYMPTOM,
                  )
                  .map((diagnosis, index) => (
                    <DiagnosticListItem
                      key={index}
                      diagnosisId={diagnosis._id || ''}
                      diagnosisLink={diagnosisLink(diagnosis, true)}
                      vehicle={diagnosis.car}
                      problems={
                        diagnosis.preliminary?.possibleReasons.map(({ title }) => title) || []
                      }
                      summary={[
                        diagnosis.fault,
                        ...(diagnosis.answers
                          ? diagnosis.answers.split('\n').filter((answer) => answer.trim())
                          : []),
                      ]}
                      questions={diagnosis.questions || []}
                      technician={diagnosis.createdBy}
                      status={
                        diagnosis.status as (typeof DIAGNOSIS_STATUS)[keyof typeof DIAGNOSIS_STATUS]
                      }
                      timestamp={formatDate(diagnosis.createdAt)}
                      onDelete={handleDeleteDiagnosis}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3 sm:mb-4 sm:p-4">
                  <FileSearch className="h-8 w-8 text-gray-500 sm:h-10 sm:w-10" />
                </div>
                <h3 className="mb-1 text-base font-medium sm:text-lg">
                  No se encontraron diagnósticos
                </h3>
                <p className="mb-4 text-sm text-gray-500 sm:text-base">
                  No hay diagnósticos recientes.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateDiagnosticModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        submitButtonText="Comenzar diagnóstico"
      />

      <CreatePreAppointmentModal
        open={isPreAppointmentModalOpen}
        onOpenChange={setIsPreAppointmentModalOpen}
      />

      <div className="sm:hidden">
        <FloatingButton onClick={() => setIsPreAppointmentModalOpen(true)}>
          <CalendarPlus className="!h-5 !w-5" />
        </FloatingButton>
      </div>
    </div>
  );
};

export default Dashboard;
