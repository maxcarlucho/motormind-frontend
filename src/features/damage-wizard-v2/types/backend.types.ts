/**
 * Tipos del backend para el frontend
 * Mantenemos paridad con los tipos del backend para consistencia
 */

import { Damage } from "@/types/DamageAssessment";
export type BackendDamage = Damage;
export type DamageAction = "REPAIR" | "REPLACE" | "PAINT" | "POLISH" | "DISASSEMBLE_AND_ASSEMBLE";

export enum PaintMaterialType {
  PRIMER = 'PRIMER',
  PLASTIC_PRIMER = 'PLASTIC_PRIMER',
  BASE_PAINT = 'BASE_PAINT',
  CLEAR_COAT = 'CLEAR_COAT',
  FILLER = 'FILLER',
  ADHESION_PROMOTER = 'ADHESION_PROMOTER',
}

export interface DocumentLink {
  label: string;
  url: string;
}

export interface SparePart {
  description: string;
  reference: string;
  quantity: number;
  price: number;
}

export interface AdditionalAction {
  description: string;
  time: number; // in minutes
  hourlyRate: number;
}

export interface PaintWork {
  type: PaintMaterialType;
  description: string;
  quantity: number;
  price: number;
}

export interface BackendCar {
  _id: string;
  vinCode: string;
  brand: string;
  model: string;
  year: string;
  data: Record<string, unknown>;
  kilometers: number;
  fuel: string;
  lastRevision: string;
  plate: string;
  workshopId: string;
  description: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BackendWorkflow {
  status: 'processing' | 'detected' | 'damages_confirmed' | 'operations_defined' | 'valuated' | 'completed' | 'error';
  history?: Array<{
    status: string;
    at: string | Date;
    note?: string;
    _id?: string;
  }>;
}

export interface BackendTchekAggregate {
  gtMotivePartName: string;
  fraction_total: number;
  surface_m2_total: number;
  roi_counts_by_type: Record<string, number>;
  max_scratch_length_dm?: number;
  max_dent_diameter_dm?: number;
}

// Tipos para los campos staged-flow que usan any en el backend
export interface BackendTchekMeta {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

export interface BackendTchekReport {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

export interface BackendGtMotiveMapping {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

export interface BackendOperationEdited {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

export interface BackendLaborOutput {
  partName: string;
  partCode: string | null;
  mainOperation: {
    code: string;
    description: string;
    estimatedHours: number;
    reason: string;
    source: string;
    complexity: string;
    dataAvailable: boolean;
    operation: string;
    total: number | null;
  };
  subOperations: BackendLaborOutput[];
}

export interface BackendPart {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

export interface BackendPaintWork {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

export interface BackendCompact {
  // TODO: Definir estructura específica cuando se conozca
  [key: string]: unknown;
}

// Interface principal del DamageAssessment del backend
export interface BackendDamageAssessment {
  _id?: string;
  carId: string;
  car?: BackendCar;
  description: string;
  images: string[];
  repairTimes?: string;
  prices?: string;
  workshopId: string;
  createdBy: string;
  damages: Damage[];
  createdAt: Date | string;
  updatedAt: Date | string;
  state: 'PENDING_REVIEW' | 'DAMAGES_CONFIRMED';
  notes?: string;
  insuranceCompany: string;
  claimNumber?: string;

  workflow?: BackendWorkflow;
  provider?: string;
  providerInspectionId?: string;
  providerReportRaw?: unknown;
  externalDamageAggregates?: BackendTchekAggregate[];
  confirmedDamages?: Damage[];
  userCreatedDamages?: Damage[];
  gtMotiveMappings?: BackendGtMotiveMapping[];
  operationsEdited?: BackendOperationEdited[];
  laborOutput?: BackendLaborOutput[];
  parts?: BackendPart[];
  paintWorks?: BackendPaintWork[];
  compact?: BackendCompact;
}

export interface BackendDamagesResponse {
  detectedDamages: Damage[];
  userCreatedDamages: Damage[];
  tchekAggregates: BackendTchekAggregate[] | Record<string, unknown>;
  images: string[];
  car: BackendCar | null;
  workflow: BackendWorkflow | null;
}
