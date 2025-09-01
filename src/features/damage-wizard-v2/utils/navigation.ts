/**
 * Utilidades para navegación del Wizard V2
 */

import { WizardStepKey, WorkflowStatus } from '../types';

export type WizardStep = WizardStepKey;

/**
 * Construye la URL del wizard con ID y step
 */
export const wizardV2Path = (assessmentId: string, step: WizardStep): string => {
  return `/damage-assessments/${assessmentId}/wizard-v2?step=${step}`;
};

/**
 * Determina el step apropiado basado en el estado del workflow
 */
export const getStepFromWorkflowStatus = (status: WorkflowStatus): WizardStep => {
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
    default:
      return 'damages';
  }
};

/**
 * Valida que un ID de assessment tenga formato válido
 */
export const isValidAssessmentId = (id: string): boolean => {
  // MongoDB ObjectId tiene 24 caracteres hexadecimales
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Valida que un step sea válido
 */
export const isValidStep = (step: string): step is WizardStep => {
  return ['intake', 'damages', 'operations', 'valuation', 'finalize'].includes(step);
};

/**
 * Mensajes de error estándar
 */
export const ERROR_MESSAGES = {
  INVALID_ID: 'El ID del assessment no es válido',
  ASSESSMENT_NOT_FOUND: 'No pudimos cargar este peritaje. Verificá el enlace o probá de nuevo.',
  INVALID_STEP: 'El paso solicitado no es válido',
  UNAUTHORIZED: 'No tienes permisos para acceder a este peritaje',
} as const;

/**
 * Mensajes de estado por paso
 */
export const STEP_MESSAGES = {
  damages: {
    processing: 'Detectando daños · Estamos procesando las imágenes… esto puede tardar unos minutos.',
    empty: 'No se detectaron daños. Podés continuar o volver a subir imágenes.',
    ready: 'Revisá y confirmá los daños detectados',
  },
  operations: {
    empty: 'Aún no hay operaciones. Generálas a partir de los daños confirmados.',
    ready: 'Revisá y editá las operaciones generadas',
  },
  valuation: {
    empty: 'Aún no hay valoración. Generála para ver tiempos y costos.',
    ready: 'Revisá la valoración completa',
  },
  finalize: {
    ready: 'Finalizá el peritaje para generar el informe',
  },
} as const;
