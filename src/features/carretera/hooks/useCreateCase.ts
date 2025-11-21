import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CaseFormData, OperatorCase } from '../types/carretera.types';

interface UseCreateCaseReturn {
    createCase: (data: CaseFormData) => Promise<string>;
    isCreating: boolean;
    error: string | null;
    createdCaseId: string | null;
    reset: () => void;
}

/**
 * Hook to create new roadside assistance cases
 * MVP version using localStorage for mock data
 */
export function useCreateCase(): UseCreateCaseReturn {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

    const createCase = async (data: CaseFormData): Promise<string> => {
        try {
            setIsCreating(true);
            setError(null);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate unique ID and case number
            const timestamp = Date.now();
            const caseId = `case-${timestamp}`;
            const caseCount = JSON.parse(localStorage.getItem('carretera_case_count') || '0') + 1;
            const caseNumber = `C-${String(caseCount).padStart(3, '0')}`;

            // Create new case object
            const newCase: OperatorCase = {
                id: caseId,
                caseNumber,
                vehiclePlate: data.vehiclePlate,
                clientName: data.clientName,
                clientPhone: data.clientPhone,
                symptom: data.symptom,
                location: data.location,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                clientLink: `/carretera/c/${caseId}`,
            };

            // Save to localStorage
            const existingCases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
            existingCases.unshift(newCase); // Add to beginning
            localStorage.setItem('carretera_operator_cases', JSON.stringify(existingCases));
            localStorage.setItem('carretera_case_count', JSON.stringify(caseCount));

            // Also create a client case entry for the client view
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            clientCases[caseId] = {
                ...newCase,
                questions: [],
                answers: [],
                currentQuestionIndex: 0,
            };
            localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));

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
