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

// Enhanced Gruista Types for Phase 3
export interface GruistaCaseDetailed {
    id: string;
    caseNumber: string;
    vehiclePlate: string;
    clientName: string;
    clientPhone: string;
    symptom: string;
    location?: string;
    status: 'new' | 'in-progress' | 'completed' | 'needs-info' | 'towing';
    assignedTo: string; // Gruista name/ID
    questions: string[];
    answers: string[];
    aiAssessment: AIAssessment;
    createdAt: Date;
    updatedAt: Date;
}

export interface AIAssessment {
    diagnosis: string;
    confidence: number; // 0-100
    recommendation: TrafficLightDecisionType;
    reasoning: string[];
}

export type TrafficLightDecisionType = 'repair' | 'info' | 'tow';

export interface DecisionSubmission {
    decision: TrafficLightDecisionType;
    notes?: string;
    workshopId?: string; // If towing
    estimatedArrival?: Date; // If towing
}

// ============================================================================
// Workshop Types (Phase 4)
// ============================================================================

export interface WorkshopCaseDetailed {
    id: string;
    caseNumber: string;
    vehiclePlate: string;
    clientName: string;
    clientPhone: string;
    symptom: string;
    location?: string;

    // Full history
    questions: string[];
    answers: string[];
    aiAssessment: AIAssessment;

    // Gruista info
    gruistaDecision: {
        decision: TrafficLightDecisionType;
        notes?: string;
        decidedAt: Date;
        gruistaName: string;
    };

    // Workshop specific
    status: WorkshopCaseStatus;
    acceptedAt?: Date;
    serviceOrderNumber?: string;
    repairStatus?: WorkshopRepairStatus;
    estimatedCompletion?: Date;

    // OBD Diagnosis (after acceptance)
    obdDiagnosis?: OBDDiagnosisData;
    generatedDiagnosis?: GeneratedDiagnosis;

    // Photos from gruista (future feature)
    photos?: string[];

    createdAt: Date;
    updatedAt: Date;
}

export type WorkshopCaseStatus =
    | 'incoming'      // Towed, not yet accepted
    | 'accepted'      // Accepted by workshop
    | 'rejected'      // Workshop rejected
    | 'in-repair'     // Currently being repaired
    | 'completed';    // Repair finished

export type WorkshopRepairStatus =
    | 'pending-inspection'
    | 'inspecting'
    | 'waiting-parts'
    | 'repairing'
    | 'testing'
    | 'completed';

export interface WorkshopRejection {
    reason: string;
    notes?: string;
    rejectedAt: Date;
    workshopName: string;
}

export type WorkshopRejectionReason =
    | 'no-capacity'
    | 'no-parts'
    | 'wrong-specialty'
    | 'other';

// ============================================================================
// OBD Diagnosis Types (Workshop)
// ============================================================================

export interface OBDDiagnosisData {
    obdCodes: string[];
    technicianComments: string;
    timestamp: Date;
    diagnosisId?: string; // ID from backend when diagnosis is generated
    diagnosisGenerated?: boolean;
    failures?: Array<{
        part: string;
        probability: number;
        description: string;
        steps: string[];
        estimatedTime?: string;
    }>;
}

export interface GeneratedDiagnosis {
    diagnosisId: string;
    failures: Array<{
        id: string;
        name: string;
        probability: number;
        description: string;
        recommendedActions: string[];
    }>;
    estimatedRepairTime?: string;
    estimatedCost?: number;
    generatedAt: Date;
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
    workshopLink?: string; // Pre-computed link for workshop
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
