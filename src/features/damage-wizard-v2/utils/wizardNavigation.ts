// URLSearchParams es nativo del navegador, no necesita import
import { WizardStepKey, WorkflowStatus } from '../types';

/**
 * Extrae el step de los search params de la URL
 */
export const extractStepFromUrl = (searchParams: URLSearchParams): string => {
    return searchParams.get('step') || 'damages';
};

/**
 * Determina el step objetivo basado en el estado del workflow
 */
export const getTargetStepFromWorkflow = (workflowStatus: WorkflowStatus): WizardStepKey => {

    let targetStep: WizardStepKey;

    switch (workflowStatus) {
        case 'processing':
            targetStep = 'damages';
            break;
        case 'detected':
            targetStep = 'damages';
            break;
        case 'damages_confirmed':
            targetStep = 'operations';
            break;
        case 'operations_defined':
            targetStep = 'valuation';
            break;
        case 'valuated':
            targetStep = 'finalize';
            break;
        case 'completed':
            targetStep = 'finalize';
            break;
        case 'error':
            targetStep = 'damages';
            break;
        default:
            targetStep = 'damages';
    }

    return targetStep;
};
