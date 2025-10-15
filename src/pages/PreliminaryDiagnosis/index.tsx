import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeftIcon, BrainCircuitIcon, FileTextIcon, PlusIcon, X } from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import { DiagnosticContextSection } from '@/components/molecules/DiagnosisContectSection';
import FaultCardCollapsible from '@/components/molecules/FaultCardCollapsible';
import HeaderPage from '@/components/molecules/HeaderPage';
import VehicleInformation from '@/components/molecules/VehicleInformation/VehicleInformation';
import { VoiceTextInput } from '@/components/molecules/VoiceTextInput';
import OBDCodeInput from '@/components/molecules/ObdCodeInput';
import { LoadingModal } from '@/components/molecules/LoadingModal';
import { useApi } from '@/hooks/useApi';
import { useSymptom } from '@/hooks/useSymptom';
import { Car } from '@/types/Car';
import { Diagnosis } from '@/types/Diagnosis';
import { ProbabilityLevel } from '@/types/Probability';
import { ConfirmFaultModal } from './ConfirmFaultModal';
import { useCarPlateOrVin } from '@/hooks/useCarPlateOrVin';
import DetailsContainer from '@/components/atoms/DetailsContainer';
import { LiveViewSessionsProvider, useLiveViewSessions } from '@/context/LiveViewSessions.context';
import { LiveViewSessionsFloater } from '@/components/molecules/LiveViewSessionsFloater';
import apiService from '@/service/api.service';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/atoms/Dialog';

const PreliminaryDiagnosisContent = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const backQueryParam = searchParams.get('back');
  const [observations, setObservations] = useState('');
  const [obdCodes, setObdCodes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingMorePossibleReasons, setIsLoadingMorePossibleReasons] = useState(false);
  const [showOldReasons, setShowOldReasons] = useState(false);
  const [currentModalTitle, setCurrentModalTitle] = useState<string>('');
  const currentSessionIdRef = useRef<string | null>(null);
  const { addSession, updateSession, removeSession, sessions, minimizeSession } = useLiveViewSessions();
  const activeSession = sessions.find((session) => session.isActive);
  const { execute: getDiagnosisById } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');
  const { execute: createFinalReportRequest } = useApi<Diagnosis>(
    'post',
    '/cars/:carId/diagnosis/:diagnosisId/final',
  );
  const { execute: getMorePossibleReasons } = useApi<Diagnosis>(
    'post',
    '/diagnoses/:diagnosisId/more-possible-reasons',
  );

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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Sincronizar obdCodes cuando cambie diagnosis
  useEffect(() => {
    if (diagnosis.obdCodes) {
      setObdCodes(diagnosis.obdCodes);
    }
  }, [diagnosis.obdCodes]);

  console.log('diagnosis', diagnosis);

  const { symptom } = useSymptom(diagnosis);
  const { mutate: createFinalReportMutation, isPending: isLoadingFinalReport } = useMutation({
    mutationFn: async ({
      observations,
      obdCodes,
      confirmedFailure,
    }: {
      observations: string;
      obdCodes: string[];
      confirmedFailure: {
        source: 'suggested' | 'custom';
        value: string;
        reasonId?: string;
      };
    }) => {
      const response = await createFinalReportRequest(
        { technicalNotes: observations, obdCodes, confirmedFailure },
        undefined,
        {
          carId: params.carId as string,
          diagnosisId: params.diagnosisId as string,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      navigate(`/cars/${params.carId}/diagnosis/${params.diagnosisId}/final-report`);
    },
    onError: () => {
      enqueueSnackbar('Error al generar el diagnóstico final. Por favor, inténtalo de nuevo.', {
        variant: 'error',
      });
    },
  });

  // LiveView mutation
  const initiateLiveViewMutation = useMutation({
    mutationFn: async (linkUrl: string) => {
      const res = await apiService.post<{ success: boolean; liveViewUrl?: string; error?: string }>(
        `/diagnoses/${params.diagnosisId}/initiate-live-view`,
        { linkUrl, linkLabel: 'Diagrama Eléctrico' },
      );
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.error || 'No se pudo iniciar Live View');
      }
      return res.data.liveViewUrl!;
    },
    onSuccess: (url) => {
      if (currentSessionIdRef.current) {
        updateSession(currentSessionIdRef.current, { liveViewUrl: url });
        currentSessionIdRef.current = null;
      }
    },
    onError: (error) => {
      console.error('Error initiating live view:', error);
      enqueueSnackbar('Error al abrir el diagrama en Live View', { variant: 'error' });
      if (currentSessionIdRef.current) {
        removeSession(currentSessionIdRef.current);
        currentSessionIdRef.current = null;
      }
    },
  });

  // Handler for electrical diagram click
  const handleElectricalDiagramClick = (linkUrl: string, linkLabel: string) => {
    setCurrentModalTitle(linkLabel);
    const sessionId = addSession({
      linkUrl,
      liveViewUrl: '',
      label: linkLabel,
      isActive: true,
      isConnected: true,
      diagnosisId: params.diagnosisId as string,
    });
    currentSessionIdRef.current = sessionId;
    initiateLiveViewMutation.mutate(linkUrl);
  };

  const carDescription = useCarPlateOrVin(
    diagnosis.car
      ? ({ ...diagnosis.car, lastRevision: diagnosis.car.lastRevision.toString() } as Car)
      : undefined,
  );

  // Filtrar averías para mostrar las nuevas por defecto
  const getReasonsToShow = () => {
    if (!diagnosis.preliminary?.possibleReasons) return [];

    if (
      !diagnosis.preliminary.newPossibleReasons ||
      diagnosis.preliminary.newPossibleReasons.length === 0
    ) {
      // Si no hay nuevas averías, mostrar todas
      return diagnosis.preliminary.possibleReasons;
    }

    if (showOldReasons) {
      // Mostrar averías viejas
      const oldIndices = diagnosis.preliminary.oldPossibleReasons || [];
      return oldIndices
        .map((index) => diagnosis.preliminary.possibleReasons[parseInt(index)])
        .filter(Boolean);
    } else {
      // Mostrar averías nuevas (por defecto)
      const newIndices = diagnosis.preliminary.newPossibleReasons;
      return newIndices
        .map((index) => diagnosis.preliminary.possibleReasons[parseInt(index)])
        .filter(Boolean);
    }
  };

  const reasonsToShow = getReasonsToShow();
  const hasOldReasons =
    diagnosis.preliminary?.oldPossibleReasons &&
    diagnosis.preliminary.oldPossibleReasons.length > 0;
  const hasNewReasons =
    diagnosis.preliminary?.newPossibleReasons &&
    diagnosis.preliminary.newPossibleReasons.length > 0;

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

  const onGenerateReport = () => {
    setIsModalOpen(true);
  };

  const handleConfirmFault = (selectedFault: string, reasonId?: string) => {
    createFinalReportMutation({
      observations,
      obdCodes,
      confirmedFailure: {
        source: reasonId ? 'suggested' : 'custom',
        value: selectedFault,
        reasonId,
      },
    });
    setIsModalOpen(false);
  };

  const onBack = () => {
    if (backQueryParam === 'true') {
      navigate(-1);
    } else {
      navigate(`/cars/${params.carId}`);
    }
  };

  const onGenerateMorePossibleReasons = async () => {
    setIsLoadingMorePossibleReasons(true);
    try {
      const response = await getMorePossibleReasons(
        {
          obdCodes,
        },
        undefined,
        {
          diagnosisId: params.diagnosisId as string,
        },
      );

      if (response.status === 200 && response.data) {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        queryClient.setQueryData(
          ['getDiagnosisById', params.diagnosisId],
          (oldData: { data: Diagnosis } | undefined) => {
            if (oldData) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  preliminary: {
                    ...oldData.data.preliminary,
                    possibleReasons: response.data.preliminary.possibleReasons,
                    oldPossibleReasons: response.data.preliminary.oldPossibleReasons,
                    newPossibleReasons: response.data.preliminary.newPossibleReasons,
                    moreReasonsRequestsQuantity:
                      response.data.preliminary.moreReasonsRequestsQuantity ??
                      oldData.data.preliminary.moreReasonsRequestsQuantity,
                  },
                },
              };
            }
            return oldData;
          },
        );
      } else {
        enqueueSnackbar('Error al generar más posibles averías. Por favor, inténtalo de nuevo.', {
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error en onGenerateMorePossibleReasons:', error);
      enqueueSnackbar('Ocurrió un error inesperado al generar más averías.', {
        variant: 'error',
      });
    }
    setIsLoadingMorePossibleReasons(false);
  };

  return (
    <div className="bg-background min-h-screen pb-56 sm:pb-24">
      <HeaderPage
        onBack={onBack}
        data={{
          title: 'Informe Preliminar IA',
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

        <div className="space-y-2 sm:space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-blue-100 p-2">
              <BrainCircuitIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h2 className="text-md font-semibold sm:text-xl">Averías Detectadas por IA</h2>
          </div>

          <div className="space-y-2 sm:space-y-4">
            {!diagnosis?.preliminary ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <>
                {hasOldReasons && hasNewReasons && (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-900">
                        {showOldReasons
                          ? `Mostrando ${reasonsToShow.length} averías anteriores`
                          : `Mostrando ${reasonsToShow.length} averías más recientes`}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOldReasons(!showOldReasons)}
                      className="text-xs"
                    >
                      {showOldReasons
                        ? `Ver ${diagnosis.preliminary.newPossibleReasons?.length || 0} nuevas`
                        : `Ver ${diagnosis.preliminary.oldPossibleReasons?.length || 0} anteriores`}
                    </Button>
                  </div>
                )}

                {reasonsToShow?.map((fault, index) => (
                  <FaultCardCollapsible
                    key={index}
                    title={fault.title}
                    probability={fault.probability as ProbabilityLevel}
                    reasoning={fault.reasonDetails}
                    recommendations={fault.diagnosticRecommendations || []}
                    tools={fault.requiredTools || []}
                    electricalDiagrams={fault.electricalDiagrams}
                    onElectricalDiagramClick={handleElectricalDiagramClick}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <OBDCodeInput
          initialCodes={obdCodes || []}
          onChange={setObdCodes}
          disabled={isLoadingFinalReport}
        />

        <div className="space-y-1 sm:space-y-2">
          <p className="block text-sm font-medium sm:text-base">
            Observaciones Adicionales del Técnico{' '}
            <span className="text-muted font-normal">(Opcional)</span>
          </p>

          <VoiceTextInput
            value={observations}
            onChange={setObservations}
            className="min-h-[150px]"
            placeholder="Añade tus hallazgos, correcciones, resultados de pruebas o información adicional sobre el diagnóstico..."
            disabled={isLoadingFinalReport}
          />
        </div>
      </DetailsContainer>

      <div className="fixed right-0 bottom-0 left-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white p-4 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="sm:hover:text-primary w-full sm:w-auto sm:border-none sm:bg-transparent sm:shadow-none sm:hover:bg-transparent"
          size="lg"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="sm:block">Volver</span>
        </Button>

        <div className="flex w-full sm:w-auto sm:gap-3">
          {(!diagnosis.preliminary.moreReasonsRequestsQuantity ||
            diagnosis.preliminary.moreReasonsRequestsQuantity < 3) && (
            <Button
              onClick={onGenerateMorePossibleReasons}
              disabled={isLoadingMorePossibleReasons}
              className="w-full sm:w-auto"
              size="lg"
              variant="outline"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Generar más posibles averías</span>
            </Button>
          )}

          <Button
            onClick={onGenerateReport}
            disabled={isLoadingFinalReport}
            className="w-full sm:w-auto"
            size="lg"
          >
            <FileTextIcon className="h-4 w-4" />
            <span>Generar Informe Final</span>
          </Button>
        </div>
      </div>

      <LoadingModal isOpen={isLoadingFinalReport} message="Generando informe final" />
      <LoadingModal
        isOpen={isLoadingMorePossibleReasons}
        message="Generando más posibles averías"
      />
      <ConfirmFaultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmFault}
        possibleReasons={diagnosis.preliminary?.possibleReasons || []}
      />

      {/* Dialog para LiveView de diagramas eléctricos */}
      <Dialog
        open={!!activeSession}
        onOpenChange={(open) => {
          if (!open && activeSession) {
            minimizeSession(activeSession.id);
          }
        }}
      >
        <DialogContent
          className="grid h-[90vh] w-[90vw] max-w-none grid-rows-[auto_1fr] gap-0 rounded-none border-none bg-white p-0 shadow-none"
          closeButton={false}
        >
          {/* Header personalizado con botón de cerrar */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {currentModalTitle}
            </DialogTitle>
            <DialogClose className="cursor-pointer rounded-full p-1 opacity-70 transition-opacity hover:bg-gray-100 hover:opacity-100 disabled:pointer-events-none">
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
          </div>

          {/* Body del modal */}
          <div className="relative overflow-hidden bg-white">
            {(() => {
              const liveViewUrl = activeSession?.liveViewUrl;

              // Mostrar spinner si no hay URL todavía
              if (!liveViewUrl || liveViewUrl === '') {
                return (
                  <div className="flex h-full items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Spinner label="Iniciando sesión remota..." />
                      <p className="mt-4 text-sm text-gray-600">
                        Conectando con HaynesPro WorkshopData...
                      </p>
                      <p className="mt-2 text-xs text-gray-500">Esto puede tomar unos segundos</p>
                    </div>
                  </div>
                );
              }

              // Mostrar iframe si hay URL válida
              return (
                <iframe
                  src={liveViewUrl}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                  allow="clipboard-read; clipboard-write; fullscreen"
                  title="Diagrama Eléctrico - HaynesPro Live View"
                />
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Componente flotante de sesiones Live View */}
      <LiveViewSessionsFloater />
    </div>
  );
};

const PreliminaryDiagnosis = () => {
  return (
    <LiveViewSessionsProvider>
      <PreliminaryDiagnosisContent />
    </LiveViewSessionsProvider>
  );
};

export default PreliminaryDiagnosis;
