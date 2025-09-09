import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeftIcon, CircleCheckBig, Share2Icon, StarIcon } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { Car } from '@/types/Car';
import { Diagnosis } from '@/types/Diagnosis';
import { DiagnosisRating } from '@/types/DiagnosisRating';
import Spinner from '@/components/atoms/Spinner';
import HeaderPage from '@/components/molecules/HeaderPage';
import VehicleInformation from '@/components/molecules/VehicleInformation/VehicleInformation';
import { RatingModal } from '@/components/molecules/RatingModal/RatingModal';
import { DiagnosticContextSection } from '@/components/molecules/DiagnosisContectSection';
import { VoiceTextInput } from '@/components/molecules/VoiceTextInput';
import { Button } from '@/components/atoms/Button';
import { AlternativeFailures } from './AlternativeFailures';
import { Conclusion } from './Conclusion';
import { PrimaryRepairSection } from './PrimaryRepairSection';
import { EstimatedResources } from './EstimatedResources';
import { useSymptom } from '@/hooks/useSymptom';
import { DIAGNOSIS_STATUS } from '@/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/Dialog';
import { useCarPlateOrVin } from '@/hooks/useCarPlateOrVin';
import DetailsContainer from '@/components/atoms/DetailsContainer';
const FinalReport = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const backQueryParam = searchParams.get('back');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [finalNotes, setFinalNotes] = useState('');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const { execute: getDiagnosisById } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');
  const { execute: updateFinalReportRequest } = useApi<Diagnosis>(
    'put',
    '/cars/:carId/diagnosis/:diagnosisId',
  );
  const { execute: createDiagnosisRating } = useApi<DiagnosisRating>('post', '/diagnosis-ratings');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['getCarById'] });
    };
  }, [params.carId, queryClient]);

  const {
    data: { data: diagnosis = {} as Diagnosis } = { data: {} as Diagnosis },
    isLoading: isLoadingDiagnosis,
    isError,
  } = useQuery<{ data: Diagnosis }>({
    queryKey: ['getDiagnosisById', params.diagnosisId],
    queryFn: async () => {
      const response = await getDiagnosisById(undefined, undefined, {
        diagnosisId: params.diagnosisId as string,
      });
      return { data: response.data };
    },
    enabled: !!params.diagnosisId,
    retry: false,
  });
  const { symptom } = useSymptom(diagnosis);
  const carDescription = useCarPlateOrVin(
    diagnosis.car
      ? ({ ...diagnosis.car, lastRevision: diagnosis.car.lastRevision.toString() } as Car)
      : undefined,
  );

  useEffect(() => {
    if (diagnosis?.finalNotes) {
      setFinalNotes(diagnosis.finalNotes);
    }
  }, [diagnosis]);

  const { mutate: updateFinalReportMutation, isPending: isLoadingFinalReport } = useMutation({
    mutationFn: async ({ finalNotes }: { finalNotes?: string }) => {
      const response = await updateFinalReportRequest({ finalNotes }, undefined, {
        carId: params.carId as string,
        diagnosisId: params.diagnosisId as string,
      });
      return response.data;
    },
    onSuccess: (updatedDiagnosis) => {
      enqueueSnackbar('Diagnóstico final actualizado correctamente', { variant: 'success' });
      setIsConfirmationModalOpen(false);
      if (!diagnosis.rating?._id) {
        setIsRatingModalOpen(true);
      }
      queryClient.setQueryData(
        ['getDiagnosisById', params.diagnosisId],
        (oldData: { data: Diagnosis }) => ({
          data: {
            ...oldData.data,
            status: updatedDiagnosis.status,
            finalNotes: updatedDiagnosis.finalNotes,
          },
        }),
      );
    },
    onError: () => {
      enqueueSnackbar('Error al guardar. Por favor, inténtalo de nuevo.', {
        variant: 'error',
      });
    },
  });

  const { mutate: createDiagnosisRatingMutation, isPending: isLoadingDiagnosisRating } =
    useMutation({
      mutationFn: async (data: DiagnosisRating) => {
        const response = await createDiagnosisRating(data);
        return response.data;
      },
      onSuccess: (rating) => {
        enqueueSnackbar('Valoración enviada, Muchas gracias!', { variant: 'success' });
        setIsRatingModalOpen(false);
        queryClient.setQueryData(
          ['getDiagnosisById', params.diagnosisId],
          (oldData: { data: Diagnosis }) => ({
            data: {
              ...oldData.data,
              rating: {
                _id: rating._id,
                wasUseful: rating.wasUseful,
                notes: rating.notes,
              },
            },
          }),
        );
      },
      onError: () => {
        enqueueSnackbar('Error al guardar la valoración. Por favor, inténtalo de nuevo.', {
          variant: 'error',
        });
      },
    });

  if (isLoadingDiagnosis)
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2">
        <Spinner />
      </div>
    );

  if (isError || !diagnosis) {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
        <div className="text-destructive flex max-w-md items-center gap-2 rounded-lg bg-red-50 p-4 text-center">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">No se puede cargar el diagnóstico</p>
            <p className="mt-1 text-sm">Este diagnóstico no existe o puede haber sido eliminado</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/cars/${params.carId}`)}>
          Volver atrás
        </Button>
      </div>
    );
  }

  const markAsRepaired = () => {
    setIsConfirmationModalOpen(true);
  };

  const updateFinalNotes = () => {
    updateFinalReportMutation({ finalNotes });
  };

  const handleConfirmRepair = () => {
    updateFinalReportMutation({ finalNotes });
  };

  const shareReport = () => {
    const url = `${window.location.origin}/cars/${params.carId}/diagnosis/${params.diagnosisId}/final-report`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar('URL del informe copiado', { variant: 'success' });
  };

  const handleRatingSubmit = (wasUseful: boolean, ratingNotes: string) => {
    createDiagnosisRatingMutation({
      diagnosisId: params.diagnosisId as string,
      notes: ratingNotes,
      wasUseful,
    });
  };

  const onBack = () => {
    if (backQueryParam === 'true') {
      navigate(-1); // Go back to the previous page
    } else {
      navigate(`/cars/${params.carId}`); // Go back to the route
    }
  };

  return (
    <div className="bg-background min-h-screen pb-56 sm:pb-24">
      <HeaderPage
        onBack={onBack}
        data={{
          title: 'Informe Final',
          description: carDescription,
        }}
      />
      <DetailsContainer>
        <VehicleInformation
          car={
            diagnosis.car
              ? ({ ...diagnosis.car, lastRevision: diagnosis.car.lastRevision.toString() } as Car)
              : undefined
          }
          editMode={false}
          minimized
        />

        <DiagnosticContextSection
          symptoms={symptom}
          notes={diagnosis.notes}
          questions={diagnosis.questions}
          answers={diagnosis.processedAnswers ?? ''}
        />

        <PrimaryRepairSection confirmedFailures={diagnosis.diagnosis?.confirmedFailures || []} />

        <AlternativeFailures alternativeFailures={diagnosis.diagnosis?.alternativeFailures || []} />

        <EstimatedResources
          diagnosisId={params.diagnosisId as string}
          estimatedResources={diagnosis.diagnosis?.estimatedBudget || {}}
        />

        <Conclusion
          recommendations={diagnosis.diagnosis?.conclusion?.recommendations || []}
          nextSteps={diagnosis.diagnosis?.conclusion?.nextSteps || []}
        />

        <div className="space-y-2">
          <p className="block text-sm font-medium sm:text-base">
            Notas Adicionales del Técnico (Internas)
          </p>
          <VoiceTextInput
            value={finalNotes}
            onChange={setFinalNotes}
            className="min-h-[150px] resize-y"
            placeholder="Añade aquí cualquier observación adicional, detalles específicos del vehículo o consideraciones especiales para la reparación..."
            disabled={isLoadingFinalReport}
          />
        </div>
      </DetailsContainer>

      <div className="fixed right-0 bottom-0 left-0 flex flex-col-reverse gap-4 border-t border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <Button
            variant="outline"
            onClick={shareReport}
            className="sm:text-foreground sm:hover:bg-accent sm:hover:text-accent-foreground w-full sm:w-auto sm:border-0 sm:bg-transparent sm:shadow-none"
            size="lg"
          >
            <Share2Icon className="h-4 w-4" />
            <span className="sm:hidden">Compartir</span>
            <span className="hidden sm:inline">Compartir</span>
          </Button>

          {!diagnosis.rating?._id && (
            <Button
              variant="outline"
              onClick={() => setIsRatingModalOpen(true)}
              className="sm:text-foreground sm:hover:bg-accent sm:hover:text-accent-foreground w-full sm:w-auto sm:border-0 sm:bg-transparent sm:shadow-none"
              size="lg"
            >
              <StarIcon className="h-4 w-4" />
              <span className="sm:hidden">Valorar</span>
              <span className="hidden sm:inline">Valorar</span>
            </Button>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoadingFinalReport}
            className="w-full sm:w-auto"
            size="lg"
          >
            <ArrowLeftIcon className="h-4 w-4 sm:mr-2" />
            <span className="sm:hidden">Volver</span>
            <span className="hidden sm:inline">Volver al detalle del Vehículo</span>
          </Button>

          {diagnosis.status === DIAGNOSIS_STATUS.REPAIRED && !!diagnosis.finalNotes && (
            <Button
              onClick={updateFinalNotes}
              disabled={diagnosis.finalNotes === finalNotes || isLoadingFinalReport}
              className="w-full sm:w-auto"
              size="lg"
            >
              <span className="sm:hidden">{isLoadingFinalReport ? 'Guardando...' : 'Guardar'}</span>
              <span className="hidden sm:inline">
                {isLoadingFinalReport ? 'Guardando...' : 'Guardar Cambios'}
              </span>
            </Button>
          )}

          {diagnosis.status !== DIAGNOSIS_STATUS.REPAIRED ? (
            <Button
              onClick={markAsRepaired}
              disabled={isLoadingFinalReport || finalNotes.length === 0}
              className="w-full sm:w-auto"
              size="lg"
            >
              <CircleCheckBig className="h-4 w-4 sm:mr-2" />
              <span className="sm:hidden">{isLoadingFinalReport ? 'Cargando...' : 'Guardar'}</span>
              <span className="hidden sm:inline">
                {isLoadingFinalReport ? 'Cargando...' : 'Marcar Reparación Completa'}
              </span>
            </Button>
          ) : (
            <Button disabled className="w-full bg-green-600 text-white sm:w-auto" size="lg">
              <CircleCheckBig className="h-4 w-4 text-white sm:mr-2" />
              Reparado
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmación</DialogTitle>
            <DialogDescription>¿Confirmás que este diagnóstico ha sido reparado?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmationModalOpen(false)}
              disabled={isLoadingFinalReport}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmRepair} disabled={isLoadingFinalReport}>
              {isLoadingFinalReport ? 'Cargando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        isLoading={isLoadingDiagnosisRating}
      />
    </div>
  );
};

export default FinalReport;
