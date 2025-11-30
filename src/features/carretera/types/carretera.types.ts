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
    /**
     * Case status flow:
     * - new: Just created, gruista hasn't seen it
     * - in-progress: Gruista is working on it
     * - repair-attempted: Gruista tried to repair but failed (can escalate to towing)
     * - completed: Successfully repaired on-site
     * - needs-info: Needs more information (deprecated, use AI recommendations)
     * - towing: Being towed to workshop
     */
    status: 'new' | 'in-progress' | 'repair-attempted' | 'completed' | 'needs-info' | 'towing';
    assignedTo: string; // Gruista name/ID
    questions: string[];
    answers: string[];
    aiAssessment: AIAssessment;
    createdAt: Date;
    updatedAt: Date;
    // Track repair attempts for escalation
    repairAttempt?: {
        attemptedAt: Date;
        notes: string;
        failureReason?: string;
        escalatedToTow?: boolean;
    };
}

// Status of the AI diagnosis process
export type DiagnosisStatus =
    | 'waiting-client'      // Client hasn't answered yet
    | 'client-answering'    // Client is answering questions
    | 'generating'          // Client finished, AI is generating diagnosis
    | 'ready';              // Pre-diagnosis is ready

export interface AIAssessment {
    diagnosis: string;
    confidence: number; // 0-100
    recommendation: TrafficLightDecisionType;
    reasoning: string[];
    // New fields for tracking diagnosis status
    status?: DiagnosisStatus;
    clientProgress?: {
        answered: number;
        total: number;
    };
    // Extended fields from AI recommendation service
    summary?: string; // Short summary for gruista (max 80 chars)
    actionSteps?: string[]; // Steps to follow if choosing this option
    risks?: string[]; // Risks if the attempt fails
    estimatedTime?: '15-30 min' | '45-60 min' | '>1 hora';
    alternativeConsideration?: string; // What to consider if situation changes
}

/**
 * Gruista decision types:
 * - repair: Successfully repaired on-site (case completed)
 * - repair-failed: Attempted repair but failed (can escalate to tow)
 * - tow: Needs to be towed to workshop
 */
export type TrafficLightDecisionType = 'repair' | 'repair-failed' | 'tow';

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
