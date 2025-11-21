import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import damageAssessmentApi from '@/service/damageAssessmentApi.service';
import { CaseFormData } from '../types/carretera.types';

interface UseCreateCaseReturn {
    createCase: (data: CaseFormData) => Promise<string>;
    isCreating: boolean;
    error: string | null;
    createdCaseId: string | null;
    reset: () => void;
}

/**
 * Hook to create new roadside assistance cases
 */
export function useCreateCase(): UseCreateCaseReturn {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

    const createCase = async (data: CaseFormData): Promise<string> => {
        try {
            setIsCreating(true);
            setError(null);

            // Create assessment via existing API
            const response = await damageAssessmentApi.intake({
                description: data.symptom,
                vehicleInfo: {
                    plate: data.vehiclePlate,
                },
                // Store client info in a way backend can handle
                // This might need adjustment based on actual backend structure
                clientInfo: {
                    name: data.clientName,
                    phone: data.clientPhone,
                    location: data.location,
                    notes: data.notes,
                },
            } as any); // Type assertion needed as backend might not have exact type yet

            const caseId = response.id;
            setCreatedCaseId(caseId);

            enqueueSnackbar('✅ Caso creado exitosamente', { variant: 'success' });

            return caseId;
        } catch (err) {
            console.error('Error creating case:', err);
            const errorMessage = 'Error al crear el caso. Por favor, intenta de nuevo.';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            throw err;
        } finally {
            setIsCreating(false);
        }
    };

    const reset = () => {
        setError(null);
        setCreatedCaseId(null);
        setIsCreating(false);
    };

    return {
        createCase,
        isCreating,
        error,
        createdCaseId,
        reset,
    };
}
