/**
 * TypeScript types for Carretera PoC
 * All types related to the client, gruista, and workshop flows
 */

// ============================================================================
// Client Assessment Types
// ============================================================================

export type AssessmentStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface VehicleInfo {
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    vin?: string;
}

export interface CarreteraAssessment {
    id: string;
    clientName: string;
    clientPhone?: string;
    symptom: string;
    questions: string[];
    answers: string[];
    status: AssessmentStatus;
    createdAt: Date;
    updatedAt: Date;
    vehicleInfo?: VehicleInfo;
    workflowId?: string;
    gruistaId?: string;
    workshopId?: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export type MessageType = 'ai' | 'user' | 'system';

export interface ChatMessageData {
    id: string;
    content: string;
    type: MessageType;
    timestamp: Date;
    isTyping?: boolean;
}

// ============================================================================
// Gruista (Tow Truck Driver) Types
// ============================================================================

export type TrafficLightColor = 'green' | 'yellow' | 'red';

export interface TrafficLightDecision {
    color: TrafficLightColor;
    probability: number;
    recommendation: string;
    suggestedAction: 'repair-onsite' | 'tow-to-workshop' | 'review-needed';
    requiredTools?: string[];
}

export interface PossibleReason {
    _id?: string;
    title: string;
    probability: string; // "Alta", "Media", "Baja"
    reasonDetails: string;
    diagnosticRecommendations: string[];
    requiredTools: string[];
}

export interface GruistaCase {
    id: string;
    assessmentId: string;
    clientName: string;
    vehicleInfo: VehicleInfo;
    symptom: string;
    status: AssessmentStatus;
    trafficLight?: TrafficLightDecision;
    possibleReasons?: PossibleReason[];
    location?: {
        address: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    priority?: 'high' | 'medium' | 'low';
    assignedAt?: Date;
    estimatedArrival?: Date;
}

export type GruistaActionType = 'repaired-onsite' | 'towed' | 'cancelled';

export interface GruistaAction {
    caseId: string;
    action: GruistaActionType;
    notes?: string;
    timestamp: Date;
    workshopLink?: string; // Generated link for workshop if towed
}

// ============================================================================
// Workshop Types
// ============================================================================

export interface WorkshopCase {
    id: string;
    assessmentId: string;
    vehicleInfo: VehicleInfo;
    symptom: string;
    clientAnswers: string[];
    aiDiagnosis: {
        possibleReasons: PossibleReason[];
        recommendations: string[];
    };
    gruistaNotes?: string;
    arrivedAt: Date;
    status: 'received' | 'in-diagnosis' | 'completed';
}

// ============================================================================
// API Response Types (Backend Integration)
// ============================================================================

export interface IntakeApiResponse {
    id: string;
    workflow: Record<string, unknown> | null;
    tchekId?: string;
}

export interface AssessmentApiResponse {
    _id: string;
    carId: string;
    description: string;
    images: string[];
    workflow?: {
        questions?: string[];
        answers?: string[];
        status?: string;
        clientName?: string;
        clientPhone?: string;
        location?: string;
    };
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Operator Dashboard Types
// ============================================================================

export interface OperatorCase {
    id: string;
    caseNumber: string; // User-friendly ID (e.g., "C-001")
    vehiclePlate: string;
    clientName: string;
    clientPhone: string;
    symptom: string;
    location?: string;
    status: AssessmentStatus;
    createdAt: Date;
    updatedAt: Date;
    clientLink: string; // Pre-computed link
}

export interface CaseFormData {
    vehiclePlate: string;
    symptom: string;
    clientName: string;
    clientPhone: string;
    location?: string;
    notes?: string;
}

export interface CaseFilters {
    status?: AssessmentStatus | 'all';
    search?: string;
    sortBy?: 'createdAt' | 'status' | 'plate';
    sortOrder?: 'asc' | 'desc';
}
