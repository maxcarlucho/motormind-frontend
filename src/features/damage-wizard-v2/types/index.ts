import { Damage } from "@/types/DamageAssessment";

export type Severity = 'leve' | 'medio' | 'grave';

export type DamageStatus = 'pending' | 'confirmed' | 'rejected';

export type OperationKind = 'PULIR' | 'REPARAR' | 'PINTAR' | 'REPARAR_Y_PINTAR' | 'SUSTITUIR';

// Nuevos tipos para el sistema de recomendación de operaciones

export type OperationSource = 'autodata' | 'rule_engine' | 'no_data';

export interface ProposedMainOperation {
  operation: string;
  confidence: number;
  reason: string;
  source: OperationSource;
}

export interface ProposedSubOperation {
  operation: string;
  confidence: number;
  reason: string;
}

export interface ProposedOperation {
  main: ProposedMainOperation;
  subOperations: ProposedSubOperation[];
}

export interface EditedMainOperation {
  operation: string;
  reason: string;
}

export interface EditedSubOperation {
  operation: string;
  reason: string;
}

export interface EditedOperation {
  main: EditedMainOperation;
  subOperations: EditedSubOperation[];
}

export interface BackendOperation {
  mappingId: string;
  partName: string;
  partCode?: string;
  proposedOperation?: ProposedOperation;
  editedOperation?: EditedOperation;
  effectiveOperation: ProposedMainOperation | EditedMainOperation;
  hasUserOverride: boolean;
}

export interface BatchActionStats {
  total: number;
  confirmed: number;
  rejected: number;
  pending: number;
}

/**
 * Operación de mano de obra (sin pintura)
 */
export interface LaborOperation {
  id: string;
  piece: string;
  operation: string;
  hours: number;
  rate: number; // €/hour
  total: number;
  source: 'autodata' | 'manual';
  isManuallyAdjusted?: boolean;
}

/**
 * Operación de pintura (mano de obra)
 */
export interface PaintOperation {
  id: string;
  piece: string;
  operation: string;
  hours: number;
  rate: number; // €/hour
  total: number;
}

/**
 * Material de pintura
 */
export interface PaintMaterial {
  id: string;
  piece: string;
  description: string;
  units: string; // e.g., "0.5L"
  pricePerUnit: number; // €/unit
  total: number;
}

/**
 * Recambio/Pieza
 */
export interface SparePart {
  id: string;
  piece: string;
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isManuallyAdjusted?: boolean;
}

/**
 * Resumen de totales para valoración
 */
export interface ValuationTotals {
  laborWithoutPaint: number;
  paintLabor: number;
  paintMaterials: number;
  spareParts: number;
  subtotal: number;
  tax: number; // IVA 21%
  total: number;
}

export type DamageSource = 'autodata' | 'segment_lookup' | 'calc' | 'user_override' | 'no_data';

export type WizardStepKey =
  | 'intake'
  | 'damages'
  | 'operations'
  | 'valuation'
  | 'finalize';

export type WorkflowStatus =
  | 'processing'
  | 'detected'
  | 'damages_confirmed'
  | 'operations_defined'
  | 'valuated'
  | 'completed'
  | 'error';

export type WizardStep = {
  key: WizardStepKey;
  title: string;
  subtitle?: string;
  status: 'inactive' | 'active' | 'complete';
};


export interface FrontendOperation {
  id: string;
  partName: string;
  damageType: string;
  severity: 'leve' | 'medio' | 'grave';
  operation: OperationKind;
  originalDamage: Damage;
}
