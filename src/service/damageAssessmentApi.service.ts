import axios, { AxiosInstance } from 'axios';
import { apiUrl } from '@/constants/env';
import { BackendDamagesResponse } from '@/features/damage-wizard-v2/types/backend.types';

// ✅ UNIFICADO: Usar BackendDamagesResponse directamente
export type DetectedDamagesResponse = BackendDamagesResponse;

export interface IntakeResponse {
    id: string;
    workflow: Record<string, unknown> | null;
    tchekId?: string;
}

class DamageAssessmentApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: apiUrl,
            headers: { 'Content-Type': 'application/json' },
        });
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }

    async intake(body?: Partial<{ vehicleInfo: unknown; images: string[]; description: string }>): Promise<IntakeResponse> {
        const { data } = await this.api.post<IntakeResponse>('/damage-assessments/intakes', body ?? {});
        return data;
    }

    async getDetectedDamages(assessmentId: string): Promise<DetectedDamagesResponse> {
        const { data } = await this.api.get<DetectedDamagesResponse>(`/damage-assessments/${assessmentId}/damages`);
        return data;
    }

    async getAssessment(assessmentId: string) {
        const { data } = await this.api.get(`/damage-assessments/${assessmentId}?_t=${Date.now()}`);
        return data;
    }

    async confirmDamages(assessmentId: string, confirmedDamageIds: string[], edits: Array<Record<string, unknown>> = []) {
        const { data } = await this.api.patch(`/damage-assessments/${assessmentId}/damages/confirm`, { confirmedDamageIds, edits });
        return data;
    }

    async createConfirmedDamage(assessmentId: string, damageData: {
        area?: string;
        subarea?: string;
        type: string;
        severity: string;
        description?: string;
        imageUrl?: string;
    }) {
        const { data } = await this.api.post(`/damage-assessments/${assessmentId}/damages/confirmed`, damageData);
        return data;
    }

    async generateOperations(assessmentId: string) {
        const { data } = await this.api.post(`/damage-assessments/${assessmentId}/operations/generate`, {});
        return data;
    }

    async batchUpdateOperations(assessmentId: string, operations: Array<{ damageId: string; proposedOperation: any }>) {
        const { data } = await this.api.patch(`/damage-assessments/${assessmentId}/operations/batch-update`, { operations });
        return data;
    }

    async generateValuationNew(assessmentId: string, force?: boolean) {
        const { data } = await this.api.post(`/damage-assessments/${assessmentId}/valuation/generate-new${force ? '?force=true' : ''}`, {});
        return data;
    }

    async finalize(assessmentId: string) {
        const { data } = await this.api.patch(`/damage-assessments/${assessmentId}/finalize`, {});
        return data;
    }
}

const damageAssessmentApi = new DamageAssessmentApiService();
export default damageAssessmentApi;


