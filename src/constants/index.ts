/*
 *----- MATRICULA MODERNA (desde 2000) ----------
 * Empieza con exactamente 4 dígitos.
 * Puede haber un espacio opcional entre los números y las letras.
 * Exactamente 3 letras excluyendo A, E, I, O, U, Ñ y Q.
 * Exactamente 3 letras excluyendo A, E, I, O, U, Ñ y Q.
 * Ejemplos: 1234 BCD / 0000XYZ / 9876TRW
 * ----- MATRICULA ANTIGUA (antes del 2000) -----
 * Código provincial (1 a 2 letras)
 * Guión o espacio opcional
 * 1 a 6 dígitos
 * Guión o espacio opcional
 * 1 a 2 letras finales (opcionales)
 * Ejemplos: M-1234-AB / PM-123456 / B-1
 */
export const PLATE_REGEX =
  /^(?:\d{4}\s?[B-DF-HJ-NP-TV-Z]{3}|[A-Z]{1,2}[-\s]?\d{1,6}[-\s]?[A-Z]{0,2})$/;

/*
 * 17 caracteres alfanuméricos
 * Solo letras mayúsculas (excepto I, O y Q)
 * No se permiten espacios, guiones, ni caracteres especiales
 */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export const PROBABILITY_LEVELS = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
} as const;

export const DIAGNOSIS_STATUS = {
  GUIDED_QUESTIONS: 'GUIDED_QUESTIONS',
  ASSIGN_OBD_CODES: 'ASSIGN_OBD_CODES',
  PRELIMINARY: 'PRELIMINARY',
  IN_REPARATION: 'IN_REPARATION',
  REPAIRED: 'REPAIRED',
  // Estados específicos para WhatsApp (pre-citas)
  WHATSAPP_AWAITING_SYMPTOM: 'WHATSAPP_AWAITING_SYMPTOM',
  WHATSAPP_AWAITING_QUESTIONS: 'WHATSAPP_AWAITING_QUESTIONS',
} as const;

export const ASSESSMENT_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  DAMAGES_CONFIRMED: 'DAMAGES_CONFIRMED',
} as const;

// ✅ NUEVO: Mapeo de assessment status a labels amigables para el usuario
export const ASSESSMENT_STATUS_LABELS = {
  [ASSESSMENT_STATUS.PENDING_REVIEW]: 'Pendiente de Revisión',
  [ASSESSMENT_STATUS.DAMAGES_CONFIRMED]: 'Daños Confirmados',
} as const;

export const FEATURES = {
  WIZARD_V2_ENABLED: import.meta.env.VITE_WIZARD_V2_ENABLED === 'true',
} as const;

// ✅ NUEVO: Mapeo de workflow status a labels amigables para el usuario
export const WORKFLOW_STATUS_LABELS = {
  processing: 'Detectando daños',
  detected: 'Daños detectados',
  damages_confirmed: 'Daños confirmados',
  operations_defined: 'Operaciones definidas',
  valuated: 'Valoración completada',
  completed: 'Valoración finalizada',
  error: 'Error en proceso',
} as const;

// ✅ NUEVO: Mapeo de diagnosis status a labels amigables para el usuario
export const DIAGNOSIS_STATUS_LABELS = {
  [DIAGNOSIS_STATUS.GUIDED_QUESTIONS]: 'Preguntas Guíadas',
  [DIAGNOSIS_STATUS.ASSIGN_OBD_CODES]: 'Asignar Códigos OBD',
  [DIAGNOSIS_STATUS.PRELIMINARY]: 'Pre-Diagnóstico',
  [DIAGNOSIS_STATUS.IN_REPARATION]: 'En Reparación',
  [DIAGNOSIS_STATUS.REPAIRED]: 'Reparado',
  [DIAGNOSIS_STATUS.WHATSAPP_AWAITING_SYMPTOM]: 'Pre-Cita - Esperando Síntoma',
  [DIAGNOSIS_STATUS.WHATSAPP_AWAITING_QUESTIONS]: 'Pre-Cita - Esperando Respuestas',
} as const;

// ✅ NUEVO: Mapeo de diagnosis status a colores CSS
export const DIAGNOSIS_STATUS_COLORS = {
  [DIAGNOSIS_STATUS.GUIDED_QUESTIONS]: 'bg-gray-100 text-gray-800 border-gray-200',
  [DIAGNOSIS_STATUS.PRELIMINARY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [DIAGNOSIS_STATUS.ASSIGN_OBD_CODES]: 'bg-orange-100 text-orange-800 border-orange-200',
  [DIAGNOSIS_STATUS.IN_REPARATION]: 'bg-blue-100 text-blue-800 border-blue-200',
  [DIAGNOSIS_STATUS.REPAIRED]: 'bg-green-100 text-green-800 border-green-200',
  [DIAGNOSIS_STATUS.WHATSAPP_AWAITING_SYMPTOM]: 'bg-purple-100 text-purple-800 border-purple-200',
  [DIAGNOSIS_STATUS.WHATSAPP_AWAITING_QUESTIONS]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
} as const;

// ✅ NUEVO: Tipo para el mapeo de workflow status
export type WorkflowStatus = keyof typeof WORKFLOW_STATUS_LABELS;

// ✅ NUEVO: Tipo para el mapeo de diagnosis status
export type DiagnosisStatus = keyof typeof DIAGNOSIS_STATUS;

// ✅ NUEVO: Tipo para el mapeo de assessment status
export type AssessmentStatus = keyof typeof ASSESSMENT_STATUS;
