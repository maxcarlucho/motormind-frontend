/**
 * Adaptadores para transformar datos entre backend y frontend
 * 
 * Backend → Frontend: Transforma respuestas del API a tipos del frontend
 * Frontend → Backend: Transforma datos del frontend para envío al API
 */

import {
  BackendDamage,
  BackendDamagesResponse,
} from '../types/backend.types';

import {
  Damage,
  LaborOperation,
  PaintOperation,
  PaintMaterial,
  SparePart,
  ValuationTotals,
} from '../types';

// ============================================================================
// BACKEND → FRONTEND (Respuestas del API)
// ============================================================================

/**
 * Adapta daños detectados del backend a formato frontend
 */
export const adaptDetectedDamages = (backendDamages: BackendDamage[]): Damage[] => {
  return backendDamages.map(damage => ({
    id: damage._id || `damage_${Math.random()}`,
    zone: damage.area,
    subzone: damage.subarea,
    type: damage.type,
    severity: adaptSeverity(damage.severity),
    confidence: 85, // Mock confidence
    imageUrl: '/placeholder-damage.jpg', // Mock image
    status: 'pending' as const,
  }));
};

/**
 * Adapta severidad del backend (SEV1/2/3/4/5) a frontend (leve/medio/grave)
 */
export const adaptSeverity = (backendSeverity: string): 'leve' | 'medio' | 'grave' => {
  switch (backendSeverity) {
    case 'SEV1':
    case 'SEV2':
      return 'leve';
    case 'SEV3':
      return 'medio';
    case 'SEV4':
    case 'SEV5':
      return 'grave';
    default:
      return 'medio';
  }
};

/**
 * Adapta operaciones de mano de obra del backend a frontend
 */
export const adaptLaborOperations = (backendOperations: any[]): LaborOperation[] => {
  return backendOperations.map(op => ({
    id: op.mappingId,
    piece: op.partName,
    operation: op.operation,
    hours: op.hours,
    rate: op.rate,
    total: op.total,
    source: adaptDataSource(op.source),
    isManuallyAdjusted: op.isManuallyAdjusted || false,
  }));
};

/**
 * Adapta operaciones de pintura del backend a frontend
 */
export const adaptPaintOperations = (backendPaintOps: any[]): PaintOperation[] => {
  return backendPaintOps.map(op => ({
    id: op.mappingId,
    piece: op.partName,
    operation: op.job,
    hours: op.paintHours,
    rate: op.paintLaborRate || 45, // Fallback rate
    total: op.paintLaborTotal,
  }));
};

/**
 * Adapta materiales de pintura del backend a frontend
 */
export const adaptPaintMaterials = (backendPaintOps: any[]): PaintMaterial[] => {
  return backendPaintOps
    .filter(op => op.units && op.unitPrice)
    .map(op => ({
      id: `${op.mappingId}-material`,
      piece: op.partName,
      description: `Materiales para ${op.job}`,
      units: `${op.units}L`,
      pricePerUnit: op.unitPrice!,
      total: op.materialsTotal,
    }));
};

/**
 * Adapta recambios del backend a frontend
 */
export const adaptSpareParts = (backendParts: any[]): SparePart[] => {
  return backendParts.map(part => ({
    id: part.ref,
    piece: part.partName,
    reference: part.ref,
    description: part.partName,
    quantity: part.qty,
    unitPrice: part.unitPrice,
    total: part.total,
    isManuallyAdjusted: part.isManuallyAdjusted || false,
  }));
};

/**
 * Adapta totales de valoración del backend a frontend
 */
export const adaptValuationTotals = (backendTotals: any): ValuationTotals => {
  const subtotal = backendTotals.grandTotal - (backendTotals.tax || 0);
  const tax = backendTotals.tax || subtotal * 0.21; // Fallback 21% IVA

  return {
    laborWithoutPaint: backendTotals.labor,
    paintLabor: backendTotals.paintLabor,
    paintMaterials: backendTotals.paintMaterials,
    spareParts: backendTotals.parts,
    subtotal,
    tax,
    total: backendTotals.grandTotal,
  };
};

/**
 * Adapta fuente de datos del backend a frontend
 */
export const adaptDataSource = (backendSource: string): 'autodata' | 'manual' => {
  switch (backendSource) {
    case 'autodata':
    case 'segment_lookup':
      return 'autodata';
    case 'user_override':
    case 'manual':
    case 'calc':
    case 'no_data':
    default:
      return 'manual';
  }
};

/**
 * Adapta respuesta completa de daños detectados
 */
export const adaptDamagesResponse = (response: BackendDamagesResponse) => {
  return {
    damages: adaptDetectedDamages(response.detectedDamages),
    images: response.images,
    car: response.car,
    workflow: response.workflow,
    tchekAggregates: response.tchekAggregates,
  };
};
/**
 * Adapta respuesta completa de operaciones
 */
export const adaptOperationsResponse = (response: any) => {
  return {
    operations: response.operations,
    metadata: response.metadata,
  };
};

/**
 * Adapta respuesta completa de valoración
 */
export const adaptValuationResponse = (response: any) => {
  const { valuation } = response;

  return {
    laborOperations: adaptLaborOperations(valuation.labor),
    paintOperations: adaptPaintOperations(valuation.paint),
    paintMaterials: adaptPaintMaterials(valuation.paint),
    spareParts: valuation.parts ? adaptSpareParts(valuation.parts) : [],
    totals: adaptValuationTotals(valuation.totals),
    metadata: response.metadata,
  };
};

// ============================================================================
// FRONTEND → BACKEND (Payloads para envío)
// ============================================================================

/**
 * Prepara payload de intake para el backend
 */
export const prepareIntakePayload = (data: {
  plate: string;
  claimDescription: string;
  images: string[];
}): any => {
  return {
    vehicleInfo: {
      plate: data.plate,
    },
    images: data.images,
    description: data.claimDescription,
  };
};

/**
 * Prepara payload de confirmación de daños para el backend
 */
export const prepareConfirmDamagesPayload = (
  confirmedDamageIds: string[],
  edits?: Array<{ damageId: string; changes: Record<string, unknown> }>
): { confirmedDamageIds: string[]; edits: Array<{ damageId: string; changes: Record<string, unknown> }> } => {
  // ✅ NUEVO: Usar IDs directos del backend (sin mapeo complejo)
  console.log('🔄 Preparing confirm damages payload:', {
    confirmedDamageIds,
    edits: edits || []
  });

  return {
    confirmedDamageIds,
    edits: edits || [],
  };
};

/**
 * Prepara cambios de operaciones para el backend
 */
export const prepareOperationsPayload = (operations: any[]) => {
  return {
    operations: operations.map(op => ({
      mappingId: op.id || op.mappingId,
      changes: op,
    })),
  };
};

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Valida que una respuesta del backend tenga la estructura esperada
 */
export const validateBackendResponse = <T>(
  response: any,
  requiredFields: (keyof T)[]
): response is T => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  return requiredFields.every(field => field in response);
};

/**
 * Crea un daño de fallback si la respuesta del backend es inválida
 */
export const createFallbackDamage = (id: string): Damage => ({
  id,
  zone: 'Zona desconocida',
  type: 'Daño detectado',
  severity: 'medio',
  confidence: 50,
  imageUrl: '/placeholder-damage.jpg',
  status: 'pending',
});

/**
 * Crea totales de fallback si la respuesta del backend es inválida
 */
export const createFallbackTotals = (): ValuationTotals => ({
  laborWithoutPaint: 0,
  paintLabor: 0,
  paintMaterials: 0,
  spareParts: 0,
  subtotal: 0,
  tax: 0,
  total: 0,
});

// ============================================================================
// HELPERS DE CONVERSIÓN
// ============================================================================

/**
 * Convierte fecha ISO string a Date object con fallback
 */
export const parseBackendDate = (dateString?: string): Date => {
  if (!dateString) return new Date();
  try {
    return new Date(dateString);
  } catch {
    return new Date();
  }
};

/**
 * Convierte números con fallback a 0
 */
export const parseBackendNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Convierte string con fallback
 */
export const parseBackendString = (value: any, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

