import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WizardStepKey } from '../types';
import { STEP_ORDER, getMaxEditableStep, isStepEditable } from './steps';
import { StepperNavProviderProps, StepperNavigationContextValue, StepMode } from './types';

const StepperNavigationContext = createContext<StepperNavigationContextValue | null>(null);

export const StepperNavigationProvider: React.FC<StepperNavProviderProps> = ({
  assessmentId,
  workflowStatus,
  currentStep,
  children,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Determinar el modo del paso actual
  const mode = useMemo((): StepMode => {
    return isStepEditable(currentStep, workflowStatus) ? 'edit' : 'view';
  }, [currentStep, workflowStatus]);

  // Verificar si se puede navegar a un paso específico
  const canGoTo = useCallback(
    (step: WizardStepKey): boolean => {
      // Si el assessment está completado, permitir navegación libre a todos los pasos
      if (workflowStatus === 'completed') {
        return true;
      }

      const stepIndex = STEP_ORDER.indexOf(step);
      const maxIndex = STEP_ORDER.indexOf(getMaxEditableStep(workflowStatus));

      return stepIndex <= maxIndex;
    },
    [workflowStatus],
  );

  // Navegar a un paso específico
  const goTo = useCallback(
    (step: WizardStepKey) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('step', step);
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams],
  );

  // Comportamiento del CTA "Continuar"
  const continueFromHere = useCallback(() => {
    if (mode === 'view') {
      // En modo solo lectura, avanzar al siguiente paso sin side-effects
      const currentIndex = STEP_ORDER.indexOf(currentStep);
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
      const nextStep = STEP_ORDER[nextIndex];
      goTo(nextStep);
    }
    // En modo edit, no hacer nada - cada página decide su comportamiento
  }, [mode, currentStep, goTo]);

  // Verificar si un paso está en solo lectura
  const isReadOnly = useCallback(
    (step?: WizardStepKey): boolean => {
      const targetStep = step || currentStep;
      return !isStepEditable(targetStep, workflowStatus);
    },
    [currentStep, workflowStatus],
  );

  const contextValue: StepperNavigationContextValue = useMemo(
    () => ({
      assessmentId,
      currentStep,
      mode,
      workflowStatus,
      canGoTo,
      goTo,
      continueFromHere,
      isReadOnly,
    }),
    [assessmentId, currentStep, mode, workflowStatus, canGoTo, goTo, continueFromHere, isReadOnly],
  );

  return (
    <StepperNavigationContext.Provider value={contextValue}>
      {children}
    </StepperNavigationContext.Provider>
  );
};

export const useWizardStepNav = (): StepperNavigationContextValue => {
  const context = useContext(StepperNavigationContext);
  if (!context) {
    throw new Error('useWizardStepNav must be used within a StepperNavigationProvider');
  }
  return context;
};
