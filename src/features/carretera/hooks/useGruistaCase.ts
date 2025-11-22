import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { GruistaCaseDetailed, TrafficLightDecisionType, DecisionSubmission } from '../types/carretera.types';
import { useAuth } from '@/context/Auth.context';

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
    const { user } = useAuth();

    useEffect(() => {
        if (!caseId) {
            setError('No se proporcionó ID de caso');
            setIsLoading(false);
            return;
        }

        loadCase(caseId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId, user]); // Re-load when user changes

    const loadCase = async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // For development, load from localStorage
            // Read from operator cases and transform to gruista format
            const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
            const clientCasesStr = localStorage.getItem('carretera_client_cases');

            if (operatorCasesStr) {
                const operatorCases = JSON.parse(operatorCasesStr);
                const clientCases = clientCasesStr ? JSON.parse(clientCasesStr) : {};

                // Find the specific case
                const opCase = operatorCases.find((c: any) => c.id === id);

                if (opCase) {
                    // Get client case data if it exists
                    const clientCase = clientCases[opCase.id] || {};

                    // Transform to gruista format
                    const gruistaStatus = opCase.status === 'pending' ? 'new' :
                                         opCase.status === 'assigned' ? 'in-progress' :
                                         opCase.status;

                    const transformedCase: GruistaCaseDetailed = {
                        id: opCase.id,
                        caseNumber: opCase.caseNumber,
                        vehiclePlate: opCase.vehiclePlate,
                        clientName: opCase.clientName,
                        clientPhone: opCase.clientPhone,
                        symptom: opCase.symptom,
                        location: opCase.location || 'No especificada',
                        status: gruistaStatus,
                        assignedTo: user?.name || 'Gruista',
                        questions: clientCase.questions || [
                            '¿Qué problema presenta el vehículo?',
                            '¿Desde cuándo ocurre?',
                            '¿Ha intentado alguna solución?'
                        ],
                        answers: clientCase.answers || [],
                        aiAssessment: clientCase.aiAssessment || {
                            diagnosis: 'Pendiente de evaluación del cliente',
                            confidence: 0,
                            recommendation: 'tow',
                            reasoning: ['Caso en espera de respuestas del cliente'],
                        },
                        createdAt: new Date(opCase.createdAt),
                        updatedAt: new Date(opCase.updatedAt),
                    };

                    setCaseData(transformedCase);
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
            // Update the operator cases directly
            const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
            if (operatorCasesStr) {
                const operatorCases = JSON.parse(operatorCasesStr);

                // Map gruista status back to operator status
                const operatorStatus = newStatus === 'new' ? 'pending' :
                                       newStatus === 'in-progress' ? 'assigned' :
                                       newStatus === 'completed' ? 'completed' :
                                       newStatus === 'towing' ? 'towing' :
                                       newStatus;

                const updatedCases = operatorCases.map((c: any) =>
                    c.id === caseData.id
                        ? { ...c, status: operatorStatus, updatedAt: new Date() }
                        : c
                );

                // Save back to operator cases
                localStorage.setItem('carretera_operator_cases', JSON.stringify(updatedCases));

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
