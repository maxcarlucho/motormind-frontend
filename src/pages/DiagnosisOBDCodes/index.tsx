import { useMutation, useQuery } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, FileTextIcon } from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import { DiagnosticContextSection } from '@/components/molecules/DiagnosisContectSection';
import HeaderPage from '@/components/molecules/HeaderPage';
import VehicleInformation from '@/components/molecules/VehicleInformation/VehicleInformation';
import OBDCodeInput from '@/components/molecules/ObdCodeInput';
import { LoadingModal } from '@/components/molecules/LoadingModal';
import { useApi } from '@/hooks/useApi';
import { useSymptom } from '@/hooks/useSymptom';
import { Car } from '@/types/Car';
import { Diagnosis } from '@/types/Diagnosis';
import DetailsContainer from '@/components/atoms/DetailsContainer';

const DiagnosisOBDCodes = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backQueryParam = searchParams.get('back');
  const [obdCodes, setObdCodes] = useState<string[]>([]);
  const { execute: getDiagnosisById } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');
  const { execute: createPreliminaryDiagnosisRequest } = useApi<Diagnosis>(
    'post',
    '/cars/:carId/diagnosis/:diagnosisId/preliminary',
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

  const { mutate: createPreliminaryDiagnosisMutation, isPending: isLoadingPreliminary } =
    useMutation({
      mutationFn: async ({ obdCodes }: { obdCodes: string[] }) => {
        const response = await createPreliminaryDiagnosisRequest({ obdCodes }, undefined, {
          carId: params.carId as string,
          diagnosisId: params.diagnosisId as string,
        });
        return response.data;
      },
      onSuccess: (data) => {
        navigate(`/cars/${params.carId}/diagnosis/${data._id}/preliminary-report`);
      },
      onError: () => {
        enqueueSnackbar('Error al generar el diagnóstico. Por favor, inténtalo de nuevo.', {
          variant: 'error',
        });
      },
    });

  const createPreliminaryDiagnosis = () => {
    createPreliminaryDiagnosisMutation({ obdCodes });
  };

  const { symptom } = useSymptom(diagnosis);

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

  const onBack = () => {
    if (backQueryParam === 'true') {
      navigate(-1);
    } else {
      navigate(`/cars/${params.carId}`);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-56 sm:pb-24">
      <HeaderPage
        onBack={onBack}
        data={{
          title: 'Introducir Códigos OBD',
        }}
      />
      <DetailsContainer>
        <VehicleInformation
          car={
            diagnosis.car
              ? ({ 
                  ...diagnosis.car, 
                  lastRevision: diagnosis.car.lastRevision ? new Date(diagnosis.car.lastRevision) : undefined 
                } as Car)
              : undefined
          }
          editMode={false}
          minimized
        />
        <DiagnosticContextSection
          symptoms={symptom}
          notes={diagnosis.notes}
          questions={diagnosis.questions}
          answers={diagnosis.processedAnswers || diagnosis.answers || ''}
        />

        <OBDCodeInput
          initialCodes={diagnosis.obdCodes || []}
          onChange={setObdCodes}
          disabled={isLoadingPreliminary}
        />
      </DetailsContainer>

      <div className="fixed right-0 bottom-0 left-0 flex justify-end gap-3 border-t border-gray-200 bg-white p-4">
        <Button
          onClick={createPreliminaryDiagnosis}
          disabled={isLoadingPreliminary}
          className="w-full sm:w-auto"
          size="lg"
        >
          <FileTextIcon className="h-4 w-4" />
          <span>Generar Informe Preliminar</span>
        </Button>
      </div>

      <LoadingModal isOpen={isLoadingPreliminary} message="Generando informe preliminar" />
    </div>
  );
};

export default DiagnosisOBDCodes;
