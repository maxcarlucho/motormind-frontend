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

export const WizardV2Entry = () => {
  const { id, damageAssessmentId } = useParams<{ id: string; damageAssessmentId: string }>();
  const [searchParams] = useSearchParams();
  const assessmentId = id || damageAssessmentId;
  const { data: assessmentData, isLoading, error } = useAssessmentData(assessmentId);
  const { isAuthorized } = useAuthGuard();

  const currentStep = (searchParams.get('step') as WizardStepKey) || 'intake';

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading) {
    return (
      <WizardV2Provider>
        <StepperNavigationProvider
          assessmentId={assessmentId || ''}
          workflowStatus="processing"
          currentStep={currentStep}
        >
          <LoadingState currentStep={currentStep} />
        </StepperNavigationProvider>
      </WizardV2Provider>
    );
  }
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!assessmentData) return <NotFoundState />;

  return (
    <WizardV2Provider>
      <WizardV2Router assessmentData={assessmentData} />
    </WizardV2Provider>
  );
};

interface WizardV2RouterProps {
  assessmentData: BackendDamageAssessment;
}

const WizardV2Router = ({ assessmentData }: WizardV2RouterProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = extractStepFromUrl(searchParams) as WizardStepKey;
  const { dispatch } = useWizardV2();

  useEffect(() => {
    if (!assessmentData?._id) return;

    dispatch({ type: 'SET_ASSESSMENT_ID', payload: assessmentData._id });

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

    if (assessmentData.workflow?.status) {
      dispatch({ type: 'SET_STATUS', payload: assessmentData.workflow.status as WorkflowStatus });
    }

    // Si tiene datos de valoración, cargarlos
    if (
      assessmentData.workflow?.status === 'valuated' ||
      assessmentData.workflow?.status === 'completed'
    ) {
      dispatch({ type: 'SET_VALUATION', payload: assessmentData });
    }
  }, [assessmentData, dispatch]);

  useEffect(() => {
    const currentStep = searchParams.get('step');

    if (!currentStep) {
      const workflowStatus = (assessmentData.workflow?.status as WorkflowStatus) || 'processing';
      const targetStep = getTargetStepFromWorkflow(workflowStatus);
      setSearchParams({ step: targetStep }, { replace: true });
    }
  }, [assessmentData.workflow?.status, searchParams, setSearchParams]);

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

export const WizardV2NewEntry = () => {
  const { isAuthorized } = useAuthGuard();

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }
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
