import { URLSearchParams } from 'react-router-dom';
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
    switch (workflowStatus) {
        case 'processing':
            return 'damages';
        case 'damages_confirmed':
            return 'operations';
        case 'operations_defined':
            return 'valuation';
        case 'valuated':
        case 'completed':
            return 'finalize';
        default:
            return 'damages';
    }
};
