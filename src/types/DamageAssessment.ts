import { Car } from './Car';
import { DocumentLink } from './Diagnosis';
import { PaintMaterialType } from './PaintMaterial';
import { DamageSeverity, DamageType, DamageAction } from './shared/damage.types';

// ✅ CENTRALIZADO: Re-exportar enums desde tipos compartidos
export { DamageSeverity, DamageType, DamageAction };

// ✅ UNIFICADO: Definición completa de DamageEvidence
export type DamagePictureROI =
    | { type: 'bbox'; x: number; y: number; w: number; h: number }   // normalized [0..1]
    | { type: 'polygon'; points: Array<{ x: number; y: number }> };  // normalized

export interface DamageEvidence {
    captureId: string;               // id de la foto en TechEck
    originalUrl: string;             // URL de la foto completa
    roi?: DamagePictureROI;          // ROI opcional
    thumbUrl?: string;               // opcional (servidor puede generar thumbnail/crop)
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
    hourlyRate: number; // hourly rate in euros
}

export interface PaintWork {
    type: PaintMaterialType;
    description: string;
    quantity: number;
    price: number;
}

// ✅ UNIFICADO: Tipo Damage completo que incluye todos los campos necesarios
export interface Damage {
    _id: string;
    area: string;
    subarea?: string;
    description: string;
    type: DamageType;
    severity: DamageSeverity;
    confidence?: number;           // ✅ NUEVO: Confidence del backend
    resources: DocumentLink[];
    isConfirmed: boolean | null;
    action?: DamageAction;

    proposedOperation?: {
        operation: DamageAction;
        confidence: number;
        reason: string;
        source: 'autodata' | 'rule_engine' | 'no_data';
    };
    editedOperation?: {
        operation: DamageAction;
        reason: string;
    };

    spareParts?: SparePart[];
    additionalActions?: AdditionalAction[];
    paintWorks?: PaintWork[];
    notes?: string;

    // ✅ NUEVO: Campos específicos del backend
    evidences?: DamageEvidence[];   // ✅ CORREGIDO: Usar tipo específico
    providerDamageId?: string;     // ID del daño en el proveedor
    partLabel?: string;            // Etiqueta de la pieza según proveedor
}

export interface DamageAssessment {
    _id: string;
    carId: string;
    car?: Car;
    description: string;
    images: string[];
    repairTimes?: string;
    prices?: string;
    createdBy: string;
    damages: Damage[];
    workshopId: string;
    createdAt: string;
    updatedAt: string;
    state: 'PENDING_REVIEW' | 'DAMAGES_CONFIRMED';
    notes?: string;
    insuranceCompany: string;
    claimNumber?: string;
}

export const severityLabels: Record<DamageSeverity, string> = {
    SEV1: 'Muy Leve',
    SEV2: 'Leve',
    SEV3: 'Moderado',
    SEV4: 'Grave',
    SEV5: 'Muy Grave',
};


export const severityColors: Record<DamageSeverity, string> = {
    SEV1: 'bg-green-100 text-green-800 border-green-300',
    SEV2: 'bg-blue-100 text-blue-800 border-blue-300',
    SEV3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    SEV4: 'bg-orange-100 text-orange-800 border-orange-300',
    SEV5: 'bg-red-100 text-red-800 border-red-300',
};

export const operationLabels: Record<string, string> = {
    REPAIR: 'Reparar',
    REPLACE: 'Sustituir',
    //PAINT: 'Pintar',
    //POLISH: 'Pulir',
    ////DISASSEMBLE_AND_ASSEMBLE: 'Desmontar y montar',
};