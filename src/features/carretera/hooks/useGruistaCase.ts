import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { GruistaCaseDetailed, TrafficLightDecisionType, DecisionSubmission } from '../types/carretera.types';
import { saveGruistaCasesToStorage } from './useGruistaCases';

interface UseGruistaCaseReturn {
    caseData: GruistaCaseDetailed | null;
    isLoading: boolean;
    error: string | null;
    submitDecision: (decision: TrafficLightDecisionType, notes?: string) => Promise<void>;
    isSubmitting: boolean;
    generateWorkshopLink: () => string;
}

/**
 * Hook to manage single gruista case details and decision submission
 */
export function useGruistaCase(caseId: string | undefined): UseGruistaCaseReturn {
    const [caseData, setCaseData] = useState<GruistaCaseDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!caseId) {
            setError('No se proporcionó ID de caso');
            setIsLoading(false);
            return;
        }

        loadCase(caseId);
    }, [caseId]);

    const loadCase = async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // For development, load from localStorage
            const stored = localStorage.getItem('gruista_cases');
            if (stored) {
                const cases: GruistaCaseDetailed[] = JSON.parse(stored).map((c: any) => ({
                    ...c,
                    createdAt: new Date(c.createdAt),
                    updatedAt: new Date(c.updatedAt),
                }));

                const foundCase = cases.find((c) => c.id === id);
                if (foundCase) {
                    setCaseData(foundCase);
                } else {
                    setError('Caso no encontrado');
                }
            } else {
                setError('No hay casos disponibles');
            }
        } catch (err) {
            console.error('Error loading case:', err);
            setError('Error al cargar el caso');
        } finally {
            setIsLoading(false);
        }
    };

    const submitDecision = async (decision: TrafficLightDecisionType, notes?: string) => {
        if (!caseData) {
            enqueueSnackbar('No hay caso cargado', { variant: 'error' });
            return;
        }

        try {
            setIsSubmitting(true);

            const submission: DecisionSubmission = {
                decision,
                notes,
            };

            // Update case status based on decision
            let newStatus: GruistaCaseDetailed['status'];
            let successMessage: string;

            switch (decision) {
                case 'repair':
                    newStatus = 'completed';
                    successMessage = '✅ Caso marcado como reparado';
                    break;
                case 'info':
                    newStatus = 'needs-info';
                    successMessage = '🟡 Solicitud de información guardada';
                    break;
                case 'tow':
                    newStatus = 'towing';
                    successMessage = '🔴 Caso marcado para remolque';
                    // Generate workshop link
                    submission.workshopId = 'workshop-001'; // Mock
                    break;
            }

            // Update in localStorage (dev mode)
            const stored = localStorage.getItem('gruista_cases');
            if (stored) {
                const cases: GruistaCaseDetailed[] = JSON.parse(stored);
                const updatedCases = cases.map((c) =>
                    c.id === caseData.id
                        ? { ...c, status: newStatus, updatedAt: new Date() }
                        : c
                );
                saveGruistaCasesToStorage(updatedCases);

                // Update local state
                setCaseData({ ...caseData, status: newStatus, updatedAt: new Date() });
            }

            enqueueSnackbar(successMessage, { variant: 'success' });

            // In production, this would be an API call:
            // await gruistaApi.submitDecision(caseData.id, submission);
        } catch (err) {
            console.error('Error submitting decision:', err);
            enqueueSnackbar('Error al enviar la decisión', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateWorkshopLink = (): string => {
        if (!caseData) return '';
        return `${window.location.origin}/carretera/t/${caseData.id}`;
    };

    return {
        caseData,
        isLoading,
        error,
        submitDecision,
        isSubmitting,
        generateWorkshopLink,
    };
}
