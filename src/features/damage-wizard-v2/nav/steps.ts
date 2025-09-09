import { WizardStepKey, WorkflowStatus } from '../types';

export const STEP_ORDER: WizardStepKey[] = ['intake', 'damages', 'operations', 'valuation', 'finalize'];

export function stepFromWorkflow(status: WorkflowStatus): WizardStepKey {
    switch (status) {
        case 'processing':
        case 'detected':
            return 'damages';
        case 'damages_confirmed':
        case 'operations_defined':
            return 'operations';
        case 'valuated':
            return 'valuation';
        case 'completed':
            return 'finalize';
        case 'error':
            return 'damages';
        default:
            return 'damages';
    }
}

export function getStepIndex(step: WizardStepKey): number {
    return STEP_ORDER.indexOf(step);
}

export function getMaxEditableStep(workflowStatus: WorkflowStatus): WizardStepKey {
    return stepFromWorkflow(workflowStatus);
}

export function getMaxEditableIndex(workflowStatus: WorkflowStatus): number {
    return getStepIndex(getMaxEditableStep(workflowStatus));
}

export function isStepEditable(currentStep: WizardStepKey, workflowStatus: WorkflowStatus): boolean {
    // Si el assessment está completado, no permitir edición en ningún paso
    if (workflowStatus === 'completed') {
        return false;
    }

    const currentIndex = getStepIndex(currentStep);
    const maxEditableIndex = getMaxEditableIndex(workflowStatus);

    return currentIndex <= maxEditableIndex;
}
