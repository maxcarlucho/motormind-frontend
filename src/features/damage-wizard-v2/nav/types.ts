import { WizardStepKey, WorkflowStatus } from '../types';

export type StepMode = 'edit' | 'view';

export interface StepperNavProviderProps {
    assessmentId: string;
    workflowStatus: WorkflowStatus;
    currentStep: WizardStepKey;
    children: React.ReactNode;
}

export interface StepperNavigationState {
    assessmentId: string;
    currentStep: WizardStepKey;
    mode: StepMode;
    workflowStatus: WorkflowStatus;
}

export interface StepperNavigationContextValue extends StepperNavigationState {
    canGoTo: (step: WizardStepKey) => boolean;
    goTo: (step: WizardStepKey) => void;
    continueFromHere: () => void;
    isReadOnly: (step?: WizardStepKey) => boolean;
}
