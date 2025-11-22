import axios, { AxiosInstance } from 'axios';
import { apiUrl } from '@/constants/env';
import {
    OperatorCase,
    CaseFormData,
    CaseFilters,
    GruistaCaseDetailed,
    DecisionSubmission,
    WorkshopCaseDetailed,
    WorkshopRepairStatus,
    WorkshopRejectionReason,
    CarreteraAssessment
} from '../types/carretera.types';

/**
 * API Service for Carretera module
 * Manages all API calls to /api/v1/carretera endpoints
 *
 * Backend structure:
 * /api/v1/carretera/
 * ├── /cases         - Operator case management
 * ├── /client        - Client diagnostic flow
 * ├── /gruista       - Tow truck driver dashboard
 * └── /workshop      - Workshop reception and tracking
 */
class CarreteraApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: `${apiUrl}/carretera`,
            headers: { 'Content-Type': 'application/json' }
        });

        // Add auth token interceptor
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Add response error interceptor
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                // Handle common errors
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // =========================================================================
    // OPERATOR ENDPOINTS - Case Management
    // =========================================================================

    /**
     * Create a new case (Operator)
     * POST /api/v1/carretera/cases
     */
    async createCase(data: CaseFormData): Promise<{ data: OperatorCase; clientLink: string }> {
        const response = await this.api.post('/cases', data);
        return response.data;
    }

    /**
     * Get all cases with optional filters (Operator)
     * GET /api/v1/carretera/cases
     */
    async getCases(filters?: CaseFilters): Promise<{ data: OperatorCase[]; total: number }> {
        const response = await this.api.get('/cases', { params: filters });
        return response.data;
    }

    /**
     * Get single case by ID (Operator)
     * GET /api/v1/carretera/cases/:id
     */
    async getCase(caseId: string): Promise<{ data: OperatorCase }> {
        const response = await this.api.get(`/cases/${caseId}`);
        return response.data;
    }

    /**
     * Update case (Operator)
     * PATCH /api/v1/carretera/cases/:id
     */
    async updateCase(caseId: string, updates: Partial<OperatorCase>): Promise<{ data: OperatorCase }> {
        const response = await this.api.patch(`/cases/${caseId}`, updates);
        return response.data;
    }

    /**
     * Delete case (Operator)
     * DELETE /api/v1/carretera/cases/:id
     */
    async deleteCase(caseId: string): Promise<{ success: boolean }> {
        const response = await this.api.delete(`/cases/${caseId}`);
        return response.data;
    }

    // =========================================================================
    // CLIENT ENDPOINTS - Diagnostic Flow
    // =========================================================================

    /**
     * Get case info for client view
     * GET /api/v1/carretera/client/:caseId
     */
    async getClientCase(caseId: string): Promise<{ data: CarreteraAssessment }> {
        const response = await this.api.get(`/client/${caseId}`);
        return response.data;
    }

    /**
     * Get diagnostic questions for client
     * GET /api/v1/carretera/client/:caseId/questions
     */
    async getClientQuestions(caseId: string): Promise<{ data: string[] }> {
        const response = await this.api.get(`/client/${caseId}/questions`);
        return response.data;
    }

    /**
     * Submit client answers
     * POST /api/v1/carretera/client/:caseId/answers
     */
    async submitClientAnswers(caseId: string, answers: string[]): Promise<{ data: CarreteraAssessment }> {
        const response = await this.api.post(`/client/${caseId}/answers`, { answers });
        return response.data;
    }

    /**
     * Complete client assessment
     * POST /api/v1/carretera/client/:caseId/complete
     */
    async completeClientAssessment(caseId: string): Promise<{
        data: {
            aiAssessment: any;
            gruistaLink: string;
        }
    }> {
        const response = await this.api.post(`/client/${caseId}/complete`);
        return response.data;
    }

    // =========================================================================
    // GRUISTA ENDPOINTS - Tow Truck Driver Dashboard
    // =========================================================================

    /**
     * Get all cases assigned to gruista
     * GET /api/v1/carretera/gruista/cases
     */
    async getGruistaCases(gruistaId?: string): Promise<{ data: GruistaCaseDetailed[] }> {
        const response = await this.api.get('/gruista/cases', {
            params: { gruistaId }
        });
        return response.data;
    }

    /**
     * Get single case for gruista
     * GET /api/v1/carretera/gruista/cases/:id
     */
    async getGruistaCase(caseId: string): Promise<{ data: GruistaCaseDetailed }> {
        const response = await this.api.get(`/gruista/cases/${caseId}`);
        return response.data;
    }

    /**
     * Submit gruista decision (repair/info/tow)
     * POST /api/v1/carretera/gruista/cases/:id/decision
     */
    async submitGruistaDecision(caseId: string, decision: DecisionSubmission): Promise<{
        data: {
            success: boolean;
            workshopLink?: string;
        }
    }> {
        const response = await this.api.post(`/gruista/cases/${caseId}/decision`, decision);
        return response.data;
    }

    /**
     * Update case status (gruista)
     * PATCH /api/v1/carretera/gruista/cases/:id/status
     */
    async updateGruistaStatus(caseId: string, status: string): Promise<{ data: GruistaCaseDetailed }> {
        const response = await this.api.patch(`/gruista/cases/${caseId}/status`, { status });
        return response.data;
    }

    // =========================================================================
    // WORKSHOP ENDPOINTS - Workshop Reception and Tracking
    // =========================================================================

    /**
     * Get all workshop cases
     * GET /api/v1/carretera/workshop/cases
     */
    async getWorkshopCases(): Promise<{ data: WorkshopCaseDetailed[] }> {
        const response = await this.api.get('/workshop/cases');
        return response.data;
    }

    /**
     * Get single workshop case
     * GET /api/v1/carretera/workshop/cases/:id
     */
    async getWorkshopCase(caseId: string): Promise<{ data: WorkshopCaseDetailed }> {
        const response = await this.api.get(`/workshop/cases/${caseId}`);
        return response.data;
    }

    /**
     * Accept workshop case
     * POST /api/v1/carretera/workshop/cases/:id/accept
     */
    async acceptWorkshopCase(caseId: string): Promise<{
        data: {
            serviceOrderNumber: string;
            updatedCase: WorkshopCaseDetailed;
        }
    }> {
        const response = await this.api.post(`/workshop/cases/${caseId}/accept`);
        return response.data;
    }

    /**
     * Submit OBD diagnosis and generate full diagnosis
     * POST /api/v1/carretera/workshop/cases/:id/diagnosis
     */
    async submitOBDDiagnosis(
        caseId: string,
        obdCodes: string[],
        technicianComments: string
    ): Promise<{
        data: {
            diagnosisId: string;
            failures: any[];
            serviceOrderNumber: string;
        }
    }> {
        const response = await this.api.post(`/workshop/cases/${caseId}/diagnosis`, {
            obdCodes,
            technicianComments
        });
        return response.data;
    }

    /**
     * Reject workshop case
     * POST /api/v1/carretera/workshop/cases/:id/reject
     */
    async rejectWorkshopCase(
        caseId: string,
        reason: WorkshopRejectionReason,
        notes?: string
    ): Promise<{ data: WorkshopCaseDetailed }> {
        const response = await this.api.post(`/workshop/cases/${caseId}/reject`, {
            reason,
            notes
        });
        return response.data;
    }

    /**
     * Update repair status
     * PATCH /api/v1/carretera/workshop/cases/:id/repair-status
     */
    async updateRepairStatus(
        caseId: string,
        status: WorkshopRepairStatus
    ): Promise<{ data: WorkshopCaseDetailed }> {
        const response = await this.api.patch(`/workshop/cases/${caseId}/repair-status`, {
            status
        });
        return response.data;
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Check if API is available
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.api.get('/health');
            return response.data.status === 'ok';
        } catch {
            return false;
        }
    }

    /**
     * Get API configuration/feature flags
     */
    async getConfig(): Promise<{
        features: {
            realTimeUpdates: boolean;
            photoUpload: boolean;
            voiceNotes: boolean;
        };
        limits: {
            maxPhotosPerCase: number;
            maxOBDCodes: number;
        };
    }> {
        const response = await this.api.get('/config');
        return response.data;
    }
}

// Export singleton instance
const carreteraApi = new CarreteraApiService();

export default carreteraApi;

// Export for testing
export { CarreteraApiService };
