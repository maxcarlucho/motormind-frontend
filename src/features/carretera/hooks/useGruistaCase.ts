import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { GruistaCaseDetailed, TrafficLightDecisionType, DecisionSubmission, WorkshopCaseDetailed, AIAssessment } from '../types/carretera.types';
import { useAuth } from '@/context/Auth.context';
import { useApi } from '@/hooks/useApi';
import { Diagnosis } from '@/types/Diagnosis';

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
 * Now connects with backend to get real AI diagnosis
 */
export function useGruistaCase(caseId: string | undefined): UseGruistaCaseReturn {
    const [caseData, setCaseData] = useState<GruistaCaseDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    // API hook to get diagnosis from backend
    const { execute: getDiagnosis } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');

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

            // Load from localStorage first
            const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
            const clientCasesStr = localStorage.getItem('carretera_client_cases');

            if (!operatorCasesStr) {
                setError('No hay casos disponibles');
                return;
            }

            const operatorCases = JSON.parse(operatorCasesStr);
            const clientCases = clientCasesStr ? JSON.parse(clientCasesStr) : {};

            // Find the specific case
            const opCase = operatorCases.find((c: any) => c.id === id);

            if (!opCase) {
                setError('Caso no encontrado');
                return;
            }

            // Get client case data if it exists
            const clientCase = clientCases[opCase.id] || {};

            // Transform status for gruista view
            const gruistaStatus = opCase.status === 'pending' ? 'new' :
                opCase.status === 'assigned' ? 'in-progress' :
                    opCase.status;

            // Try to get AI Assessment from backend if we have a diagnosisId
            let aiAssessment: AIAssessment = clientCase.aiAssessment || {
                diagnosis: 'Pendiente de evaluación del cliente',
                confidence: 0,
                recommendation: 'tow',
                reasoning: ['Caso en espera de respuestas del cliente'],
            };

            // PROBLEM 3 FIX: Fetch real diagnosis from backend
            const diagnosisId = clientCase.diagnosisId;
            const token = localStorage.getItem('token');

            if (diagnosisId && token) {
                try {
                    console.log('Fetching diagnosis from backend:', diagnosisId);
                    const diagnosisResponse = await getDiagnosis(undefined, undefined, {
                        diagnosisId
                    });

                    const diagnosis = diagnosisResponse.data;
                    console.log('Backend diagnosis received:', diagnosis);

                    // Extract AI assessment from backend preliminary data
                    if (diagnosis.preliminary?.possibleReasons?.length > 0) {
                        const possibleReasons = diagnosis.preliminary.possibleReasons;
                        const topReason = possibleReasons[0];

                        aiAssessment = {
                            diagnosis: topReason.title || diagnosis.fault,
                            confidence: topReason.probability === 'Alta' ? 85 :
                                        topReason.probability === 'Media' ? 65 : 45,
                            recommendation: determineRecommendation(diagnosis.preliminary),
                            reasoning: possibleReasons.map((r: any) => r.reasonDetails).filter(Boolean),
                        };

                        // Update localStorage with backend data for future use
                        if (clientCases[opCase.id]) {
                            clientCases[opCase.id].aiAssessment = aiAssessment;
                            clientCases[opCase.id].backendDiagnosis = diagnosis;
                            localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                        }

                        console.log('AI Assessment updated from backend:', aiAssessment);
                    } else if (diagnosis.fault && !clientCase.aiAssessment) {
                        // At least show the symptom if no preliminary yet
                        aiAssessment = {
                            diagnosis: diagnosis.fault,
                            confidence: 30,
                            recommendation: 'info',
                            reasoning: ['Diagnóstico IA en proceso', 'Esperando respuestas del cliente'],
                        };
                    }
                } catch (apiError) {
                    console.log('Could not fetch diagnosis from backend, using local data:', apiError);
                    // Keep using local aiAssessment
                }
            }

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
                aiAssessment: aiAssessment,
                createdAt: new Date(opCase.createdAt),
                updatedAt: new Date(opCase.updatedAt),
            };

            setCaseData(transformedCase);
        } catch (err) {
            console.error('Error loading case:', err);
            setError('Error al cargar el caso');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to determine recommendation
    function determineRecommendation(preliminary: any): 'repair' | 'info' | 'tow' {
        if (!preliminary?.possibleReasons?.length) return 'tow';

        const topReason = preliminary.possibleReasons[0];
        const requiredTools = topReason.requiredTools || [];
        const simpleTools = ['llave', 'destornillador', 'multímetro', 'cables', 'pinzas'];

        const hasSimpleTools = requiredTools.length === 0 || requiredTools.every((tool: string) =>
            simpleTools.some(simple => tool.toLowerCase().includes(simple))
        );

        if (topReason.probability === 'Alta' && hasSimpleTools && requiredTools.length <= 2) {
            return 'repair';
        }

        if (topReason.probability === 'Media') {
            return 'info';
        }

        return 'tow';
    }

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
                const operatorStatus = newStatus === 'completed' ? 'completed' :
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

            // PROBLEM 2 FIX: When towing, create the workshop case
            if (decision === 'tow') {
                createWorkshopCase(caseData, notes, user?.name || 'Gruista');
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

/**
 * Creates a workshop case when gruista decides to tow
 * This ensures the workshop has all the information when they receive the vehicle
 */
function createWorkshopCase(
    gruistaCase: GruistaCaseDetailed,
    gruistaNotes: string | undefined,
    gruistaName: string
): void {
    try {
        // Get existing workshop cases
        const existingCasesStr = localStorage.getItem('carretera_workshop_cases');
        const existingCases: WorkshopCaseDetailed[] = existingCasesStr
            ? JSON.parse(existingCasesStr)
            : [];

        // Check if case already exists (avoid duplicates)
        const existingIndex = existingCases.findIndex(c => c.id === gruistaCase.id);

        // Build the workshop case with all relevant data
        const workshopCase: WorkshopCaseDetailed = {
            id: gruistaCase.id,
            caseNumber: gruistaCase.caseNumber,
            vehiclePlate: gruistaCase.vehiclePlate,
            clientName: gruistaCase.clientName,
            clientPhone: gruistaCase.clientPhone,
            symptom: gruistaCase.symptom,
            location: gruistaCase.location,

            // Full client Q&A history
            questions: gruistaCase.questions,
            answers: gruistaCase.answers,

            // AI Assessment from client flow
            aiAssessment: gruistaCase.aiAssessment,

            // Gruista decision info
            gruistaDecision: {
                decision: 'tow',
                notes: gruistaNotes,
                decidedAt: new Date(),
                gruistaName: gruistaName,
            },

            // Workshop status - starts as 'incoming'
            status: 'incoming',

            // Timestamps
            createdAt: gruistaCase.createdAt,
            updatedAt: new Date(),
        };

        if (existingIndex >= 0) {
            // Update existing case
            existingCases[existingIndex] = workshopCase;
        } else {
            // Add new case at the beginning
            existingCases.unshift(workshopCase);
        }

        // Save to localStorage
        localStorage.setItem('carretera_workshop_cases', JSON.stringify(existingCases));

        console.log('Workshop case created:', workshopCase.id);
    } catch (err) {
        console.error('Error creating workshop case:', err);
    }
}
