import { WizardStepKey } from '../types';

export const wizardV2Path = (id: string, step: WizardStepKey) =>
    `/damage-assessments/${id}/wizard-v2?step=${step}`;

export const extractStepFromUrl = (searchParams: URLSearchParams): WizardStepKey => {
    const step = searchParams.get('step') || 'damages';
    return step as WizardStepKey;
};
