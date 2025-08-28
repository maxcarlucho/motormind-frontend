import { useEffect, useMemo } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { WizardV2Provider, useWizardV2 } from './context/WizardV2Context';
import { StepperNavigationProvider } from './nav';
import { BackendDamagesResponse, BackendDamageAssessment } from './types/backend.types';
import { WizardStepKey, WorkflowStatus } from './types';
import { extractStepFromUrl, getTargetStepFromWorkflow } from './utils/wizardNavigation';
import { useAssessmentData, useAuthGuard } from './hooks/useWizardData';
import { LoadingState, ErrorState, NotFoundState } from './components/WizardStates';

import { Damage } from '@/types/DamageAssessment';
import Damages from './pages/Damages';
import Finalize from './pages/Finalize';
import Intake from './pages/Intake';
import Operations from './pages/Operations';
import Valuation from './pages/Valuation';

const WIZARD_V2_ENABLED = import.meta.env.VITE_WIZARD_V2_ENABLED === 'true';

// ============================================================================
// COMPONENTE PRINCIPAL DEL ROUTER
// ============================================================================

export const WizardV2Entry = () => {
  const { id, damageAssessmentId } = useParams<{ id: string; damageAssessmentId: string }>();
  const assessmentId = id || damageAssessmentId;
  const { data: assessmentData, isLoading, error } = useAssessmentData(assessmentId);
  const { isAuthorized } = useAuthGuard();

  // Verificar permisos
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  // Estados de carga y error
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!assessmentData) return <NotFoundState />;

  return (
    <WizardV2Provider>
      <WizardV2Router assessmentData={assessmentData} />
    </WizardV2Provider>
  );
};

// ============================================================================
// ROUTER INTERNO
// ============================================================================

interface WizardV2RouterProps {
  assessmentData: BackendDamageAssessment;
}

const WizardV2Router = ({ assessmentData }: WizardV2RouterProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = extractStepFromUrl(searchParams) as WizardStepKey;
  const { dispatch } = useWizardV2();

  // Cargar datos en el contexto
  useEffect(() => {
    if (!assessmentData?._id) return;

    // Establecer assessmentId
    dispatch({ type: 'SET_ASSESSMENT_ID', payload: assessmentData._id });

    // Cargar datos del intake
    if (assessmentData.car?.plate || assessmentData.description || assessmentData.images) {
      dispatch({
        type: 'START_INTAKE',
        payload: {
          plate: assessmentData.car?.plate || '',
          claimDescription: assessmentData.description || '',
          images: assessmentData.images || [],
        },
      });
    }

    // Cargar damages
    if (assessmentData.damages) {
      const damagesResponse: BackendDamagesResponse = {
        detectedDamages: assessmentData.damages,
        userCreatedDamages: assessmentData.userCreatedDamages || [],
        tchekAggregates: assessmentData.externalDamageAggregates || [],
        images: assessmentData.images || [],
        car: assessmentData.car || null,
        workflow: assessmentData.workflow || null,
      };
      dispatch({ type: 'SET_DETECTED_DAMAGES', payload: damagesResponse });
    }

    // Cargar daños confirmados
    if (assessmentData.confirmedDamages?.length) {
      dispatch({
        type: 'CONFIRM_DAMAGES',
        payload: {
          ids: assessmentData.confirmedDamages.map(
            (d: Damage) => d._id || `${d.area}-${d.subarea}`,
          ),
          damages: assessmentData.confirmedDamages,
        },
      });
    }

    // Establecer estado del workflow
    if (assessmentData.workflow?.status) {
      dispatch({ type: 'SET_STATUS', payload: assessmentData.workflow.status as WorkflowStatus });
    }
  }, [assessmentData._id, dispatch]);

  // Redirección automática según workflow
  useEffect(() => {
    const currentStep = searchParams.get('step');
    console.log('🔄 Redirección automática - currentStep:', currentStep);

    if (!currentStep) {
      const workflowStatus = (assessmentData.workflow?.status as WorkflowStatus) || 'processing';
      console.log('🔄 Redirección automática - workflowStatus:', workflowStatus);

      const targetStep = getTargetStepFromWorkflow(workflowStatus);
      console.log('🔄 Redirección automática - targetStep:', targetStep);

      setSearchParams({ step: targetStep }, { replace: true });
    }
  }, [assessmentData.workflow?.status, searchParams, setSearchParams]);

  // Renderizar componente según step
  const Component = useMemo(() => {
    switch (step) {
      case 'intake':
        return <Intake />;
      case 'damages':
        return <Damages />;
      case 'operations':
        return <Operations />;
      case 'valuation':
        return <Valuation />;
      case 'finalize':
        return <Finalize />;
      default:
        return <Damages />;
    }
  }, [step]);

  const workflowStatus = (assessmentData.workflow?.status as WorkflowStatus) || 'processing';

  return (
    <StepperNavigationProvider
      assessmentId={assessmentData._id || ''}
      workflowStatus={workflowStatus}
      currentStep={step}
    >
      {Component}
    </StepperNavigationProvider>
  );
};

// ============================================================================
// ENTRADA PARA CREAR NUEVO ASSESSMENT
// ============================================================================

export const WizardV2NewEntry = () => {
  const { isAuthorized } = useAuthGuard();

  // Verificar permisos
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si el wizard está habilitado
  if (!WIZARD_V2_ENABLED) {
    return <Navigate to="/damage-assessments/create" />;
  }

  return (
    <WizardV2Provider>
      <StepperNavigationProvider
        assessmentId="new"
        workflowStatus="processing"
        currentStep="intake"
      >
        <Intake />
      </StepperNavigationProvider>
    </WizardV2Provider>
  );
};

export const wizardV2Routes = [
  {
    path: '/damage-assessments/:id/wizard-v2',
    element: <WizardV2Entry />,
  },
];

export default WizardV2Entry;
