
import { Car } from './Car';
import { DocumentLink } from './Diagnosis';
import { PaintMaterialType } from './PaintMaterial';
import { User } from './User';


export enum DamageAction {
    REPAIR = 'REPAIR',
    REPLACE = 'REPLACE',
    PAINT = 'PAINT',
    POLISH = 'POLISH',
    REPAIR_AND_PAINT = 'REPAIR_AND_PAINT'
}

export enum DamageType {
    SCRATCH = 'scratch',
    DENT = 'dent',
    CRACK = 'crack',
    BREAK = 'break',
    // Tipos específicos de Tchek
    PAINT_PEEL = 'paint_peel',
    DEFORMATION = 'deformation',
    IMPACT = 'impact',
    RUST = 'rust',
    DISLOCATED_PART = 'dislocated_part',
    BROKEN_PART = 'broken_part',
    MISSING_PART = 'missing_part',
    DETACHED_PART = 'detached_part',
    HOLE = 'hole',
    BURN = 'burn',
    CORROSION = 'corrosion',
}

export enum DamageSeverity {
    SEV1 = 'SEV1',
    SEV2 = 'SEV2',
    SEV3 = 'SEV3',
    SEV4 = 'SEV4',
    SEV5 = 'SEV5',
}



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

export type WorkflowStatus = 'processing' | 'detected' | 'damages_confirmed' | 'operations_defined' | 'valuated' | 'completed' | 'error';

export interface Workflow {
    status: WorkflowStatus;
    history?: Array<{
        status: string;
        at: string | Date;
        note?: string;
        _id?: string;
    }>;
}

export interface DamageAssessment {
    _id: string;
    carId: string;
    car?: Car;
    description: string;
    images: string[];
    repairTimes?: string;
    prices?: string;
    createdBy: string | User;
    damages: Damage[];
    confirmedDamages?: Damage[];
    workshopId: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    insuranceCompany: string;
    claimNumber?: string;
    workflow?: Workflow;
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



// Mapeo de tipos de daño a descripciones en español
export const damageTypeMap: Record<string, string> = {
    'dent': 'Abolladura',
    'scratch': 'Rayón',
    'broken': 'Pieza rota',
    'broken_part': 'Pieza rota',
    'break': 'Pieza rota',
    'dislocated': 'Desplazamiento',
    'dislocated_part': 'Pieza desplazada',
    'crack': 'Grieta',
    'hole': 'Agujero',
    'burn': 'Quemadura',
    'corrosion': 'Corrosión',
    'paint_peel': 'Desprendimiento de pintura',
    'deformation': 'Deformación',
    'impact': 'Impacto',
    'rust': 'Óxido',
    'missing_part': 'Pieza faltante',
    'detached_part': 'Pieza desprendida',
};

// Función helper para obtener la descripción en español de un tipo de daño
export function getDamageTypeLabel(type: DamageType | string): string {
    return damageTypeMap[type as string] || type;
}
