import { useState, useEffect, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { GruistaCaseDetailed, TrafficLightDecisionType, DecisionSubmission, WorkshopCaseDetailed, AIAssessment } from '../types/carretera.types';
import { useAuth } from '@/context/Auth.context';
import { useApi } from '@/hooks/useApi';
import { Diagnosis } from '@/types/Diagnosis';
import { generateAccessToken } from '../utils/accessToken';
import { getPublicClientUrl } from '../constants/publicUrl';

/**
 * Lógica para determinar recomendación basada en el pre-diagnóstico
 */
function determineRecommendation(preliminary: any): 'repair' | 'tow' {
    if (!preliminary?.possibleReasons?.length) return 'tow';

    const topReason = preliminary.possibleReasons[0];
    const requiredTools = topReason.requiredTools || [];
    const simpleTools = ['llave', 'destornillador', 'multímetro', 'cables', 'pinzas', 'batería', 'cargador'];

    const hasSimpleTools = requiredTools.length === 0 || requiredTools.every((tool: string) =>
        simpleTools.some(simple => tool.toLowerCase().includes(simple))
    );

    // Repair in-situ: Alta probabilidad con herramientas simples
    if (topReason.probability === 'Alta' && hasSimpleTools && requiredTools.length <= 2) {
        return 'repair';
    }

    // Media probabilidad con herramientas simples: también puede ser reparable in-situ
    if (topReason.probability === 'Media' && hasSimpleTools && requiredTools.length <= 1) {
        return 'repair';
    }

    // Por defecto: remolcar al taller (es más seguro)
    return 'tow';
}

interface UseGruistaCaseReturn {
    caseData: GruistaCaseDetailed | null;
    isLoading: boolean;
    error: string | null;
    submitDecision: (decision: TrafficLightDecisionType, notes?: string) => Promise<void>;
    isSubmitting: boolean;
    generateWorkshopLink: () => Promise<string>; // Now async (generates token)
    refresh: () => Promise<void>; // Manual refresh
    isRefreshing: boolean;
}

/**
 * Hook to manage single gruista case details and decision submission
 * Now connects with backend to get real AI diagnosis
 */
// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000;

export function useGruistaCase(caseId: string | undefined): UseGruistaCaseReturn {
    const [caseData, setCaseData] = useState<GruistaCaseDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    // API hooks for backend
    const { execute: getDiagnosis } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');
    const { execute: saveAnswers } = useApi<Diagnosis>('put', '/cars/:carId/diagnosis/:diagnosisId/answers');
    const { execute: generatePreliminary } = useApi<Diagnosis>('post', '/cars/:carId/diagnosis/:diagnosisId/preliminary');

    // Initial load
    useEffect(() => {
        if (!caseId) {
            setError('No se proporcionó ID de caso');
            setIsLoading(false);
            return;
        }

        loadCase(caseId, true); // true = initial load
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId, user]);

    // Auto-polling: refresh every 5 seconds while diagnosis is not ready
    useEffect(() => {
        if (!caseId || !caseData) return;

        // Only poll if diagnosis is NOT ready yet
        const diagnosisStatus = caseData.aiAssessment?.status;
        if (diagnosisStatus === 'ready') {
            console.log('Diagnosis ready, stopping polling');
            return; // Stop polling once ready
        }

        console.log('Setting up polling, current status:', diagnosisStatus);
        const interval = setInterval(() => {
            console.log('Polling for updates...');
            loadCase(caseId, false); // false = refresh (not initial load)
        }, POLLING_INTERVAL);

        return () => {
            console.log('Clearing polling interval');
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId, caseData?.aiAssessment?.status]);

    const loadCase = async (id: string, isInitialLoad: boolean = true) => {
        try {
            if (isInitialLoad) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }
            setError(null);

            // Load from localStorage first
            const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
            const clientCasesStr = localStorage.getItem('carretera_client_cases');

            const operatorCases = operatorCasesStr ? JSON.parse(operatorCasesStr) : [];
            const clientCases = clientCasesStr ? JSON.parse(clientCasesStr) : {};

            // Find the specific case in localStorage
            let opCase = operatorCases.find((c: any) => c.id === id);

            // If not found in localStorage, try to fetch from backend directly
            if (!opCase) {
                console.log('📡 Case not in localStorage, fetching from backend:', id);
                const token = localStorage.getItem('token');

                if (token) {
                    try {
                        // Try to fetch the diagnosis directly from backend using the ID
                        const response = await getDiagnosis(undefined, undefined, { diagnosisId: id });
                        const diagnosis = response.data as any;

                        if (diagnosis && diagnosis._id) {
                            console.log('✅ Found diagnosis in backend:', diagnosis._id);

                            // Transform backend diagnosis to operator case format
                            const car = diagnosis.car || {};
                            const fault = diagnosis.fault || '';
                            const cleanSymptom = fault
                                .replace(/\[ASISTENCIA CARRETERA[^\]]*\]/g, '')
                                .trim();

                            // Parse carretera data from notes (JSON format)
                            // Fallback to regex for backwards compatibility with old data
                            let carreteraData: any = null;
                            try {
                                if (diagnosis.notes && diagnosis.notes.startsWith('{')) {
                                    const parsed = JSON.parse(diagnosis.notes);
                                    carreteraData = parsed.carretera || null;
                                }
                            } catch {
                                carreteraData = null;
                            }

                            // Extract data from JSON or fallback to regex
                            const clientName = carreteraData?.clientName
                                || diagnosis.notes?.match(/Cliente:\s*([^\n]+)/)?.[1]
                                || 'Cliente';
                            const clientPhone = carreteraData?.clientPhone
                                || diagnosis.notes?.match(/Teléfono:\s*([^\n]+)/)?.[1]
                                || '';
                            const location = carreteraData?.location
                                || diagnosis.notes?.match(/Ubicación:\s*([^\n]+)/)?.[1]
                                || 'No especificada';

                            const diagnosisId = diagnosis._id as string;
                            const caseNumber = carreteraData?.caseNumber
                                || `C-${diagnosisId.slice(-4).toUpperCase()}`;

                            opCase = {
                                id: diagnosisId,
                                caseNumber,
                                vehiclePlate: car.plate || 'Sin matrícula',
                                clientName,
                                clientPhone,
                                symptom: cleanSymptom || 'Sin síntoma registrado',
                                location,
                                status: carreteraData?.status || (diagnosis.preliminary ? 'assigned' : 'pending'),
                                createdAt: diagnosis.createdAt || new Date().toISOString(),
                                updatedAt: diagnosis.updatedAt || new Date().toISOString(),
                            };

                            // Also populate clientCases with backend data
                            clientCases[id] = {
                                diagnosisId: diagnosisId,
                                carId: car._id || diagnosis.carId,
                                questions: diagnosis.questions || [],
                                answers: diagnosis.answers ? diagnosis.answers.split('|').filter((a: string) => a.trim()) : [],
                                aiAssessment: diagnosis.preliminary?.possibleReasons?.length > 0 ? {
                                    status: 'ready',
                                    diagnosis: diagnosis.preliminary.possibleReasons[0].title || diagnosis.fault,
                                    confidence: diagnosis.preliminary.possibleReasons[0].probability === 'Alta' ? 85 :
                                                diagnosis.preliminary.possibleReasons[0].probability === 'Media' ? 65 : 45,
                                    recommendation: determineRecommendation(diagnosis.preliminary),
                                    reasoning: diagnosis.preliminary.possibleReasons.map((r: any) => r.reasonDetails).filter(Boolean),
                                } : undefined,
                            };

                            // Save to localStorage for future use
                            operatorCases.push(opCase);
                            localStorage.setItem('carretera_operator_cases', JSON.stringify(operatorCases));
                            localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                            console.log('💾 Saved backend case to localStorage');
                        }
                    } catch (backendErr) {
                        console.error('Error fetching from backend:', backendErr);
                    }
                }

                if (!opCase) {
                    setError('Caso no encontrado');
                    return;
                }
            }

            // Get client case data if it exists
            const clientCase = clientCases[opCase.id] || {};

            // Transform status for gruista view
            const gruistaStatus = opCase.status === 'pending' ? 'new' :
                opCase.status === 'assigned' ? 'in-progress' :
                    opCase.status;

            // Get data from localStorage FIRST (client saves here)
            const localAnswers = clientCase.answers || [];
            const localQuestions = clientCase.questions || [];
            const totalQuestions = localQuestions.length || 4; // Default to 4 if no questions
            const answeredCount = localAnswers.length;

            // Build AI Assessment based on LOCAL data first
            let aiAssessment: AIAssessment;

            // Debug: Log what we have
            console.log('📊 Case data:', {
                caseId: opCase.id,
                diagnosisId: clientCase.diagnosisId,
                carId: clientCase.carId,
                answeredCount,
                totalQuestions,
                hasAiAssessment: !!clientCase.aiAssessment,
                aiAssessmentStatus: clientCase.aiAssessment?.status,
            });

            // Check if we already have a ready aiAssessment from client completing
            if (clientCase.aiAssessment?.status === 'ready') {
                // Client already completed and generated diagnosis
                aiAssessment = clientCase.aiAssessment;
                console.log('✅ Using cached ready aiAssessment from localStorage');
            } else if (answeredCount >= totalQuestions && totalQuestions > 0) {
                // Client finished all questions but diagnosis not generated yet
                // AUTO-GENERATE: Gruista has token, so we generate the preliminary automatically!
                const diagnosisId = clientCase.diagnosisId;
                const carId = clientCase.carId;
                const token = localStorage.getItem('token');

                if (diagnosisId && carId && token) {
                    console.log('Client finished - Auto-generating preliminary diagnosis...');
                    try {
                        // STEP 1: First, send client answers to backend
                        // The client doesn't have a token, so Gruista sends answers on their behalf
                        console.log('📤 Sending client answers to backend...');
                        // Correct endpoint: PUT /cars/:carId/diagnosis/:diagnosisId/answers
                        await saveAnswers(
                            {
                                answers: localAnswers.join('|'), // Core expects pipe-separated answers
                            },
                            undefined,
                            { carId, diagnosisId }
                        );
                        console.log('✅ Client answers saved to backend');

                        // STEP 2: Now generate preliminary with the answers in place
                        const preliminaryResponse = await generatePreliminary(
                            { obdCodes: [] }, // No OBD codes for pre-diagnosis
                            undefined,
                            { carId, diagnosisId }
                        );

                        const diagnosis = preliminaryResponse.data;
                        console.log('Preliminary generated:', diagnosis);

                        if (diagnosis.preliminary?.possibleReasons?.length > 0) {
                            const possibleReasons = diagnosis.preliminary.possibleReasons;
                            const topReason = possibleReasons[0];

                            aiAssessment = {
                                status: 'ready',
                                diagnosis: topReason.title || diagnosis.fault,
                                confidence: topReason.probability === 'Alta' ? 85 :
                                            topReason.probability === 'Media' ? 65 : 45,
                                recommendation: determineRecommendation(diagnosis.preliminary),
                                reasoning: possibleReasons.map((r: any) => r.reasonDetails).filter(Boolean),
                                clientProgress: { answered: answeredCount, total: totalQuestions },
                            };

                            // Save to localStorage
                            clientCases[opCase.id].aiAssessment = aiAssessment;
                            localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                            console.log('Pre-diagnosis READY and saved!');
                        } else {
                            // Backend didn't return possibleReasons yet, keep as generating
                            aiAssessment = {
                                status: 'generating',
                                diagnosis: opCase.symptom,
                                confidence: 0,
                                recommendation: 'tow', // Default to tow until diagnosis is ready
                                reasoning: [],
                                clientProgress: { answered: answeredCount, total: totalQuestions },
                            };
                        }
                    } catch (apiError) {
                        console.error('Error generating preliminary:', apiError);
                        // Keep as generating, will retry on next poll
                        aiAssessment = {
                            status: 'generating',
                            diagnosis: opCase.symptom,
                            confidence: 0,
                            recommendation: 'tow', // Default to tow until diagnosis is ready
                            reasoning: [],
                            clientProgress: { answered: answeredCount, total: totalQuestions },
                        };
                    }
                } else {
                    // No diagnosisId/carId/token - show generating state
                    aiAssessment = {
                        status: 'generating',
                        diagnosis: opCase.symptom,
                        confidence: 0,
                        recommendation: 'tow', // Default to tow until diagnosis is ready
                        reasoning: [],
                        clientProgress: { answered: answeredCount, total: totalQuestions },
                    };
                    console.log('Missing diagnosisId/carId/token for auto-generation');
                }
            } else if (answeredCount > 0) {
                // Client is answering questions
                aiAssessment = {
                    status: 'client-answering',
                    diagnosis: opCase.symptom,
                    confidence: 0,
                    recommendation: 'tow', // Default to tow until diagnosis is ready
                    reasoning: [],
                    clientProgress: { answered: answeredCount, total: totalQuestions },
                };
                console.log(`Client answering: ${answeredCount}/${totalQuestions}`);
            } else {
                // No answers yet
                aiAssessment = {
                    status: 'waiting-client',
                    diagnosis: opCase.symptom,
                    confidence: 0,
                    recommendation: 'tow', // Default to tow until diagnosis is ready
                    reasoning: [],
                    clientProgress: { answered: 0, total: totalQuestions },
                };
                console.log('Waiting for client to start');
            }

            // NOW try to enrich with backend data if available
            const diagnosisId = clientCase.diagnosisId;
            const token = localStorage.getItem('token');

            if (diagnosisId && token && aiAssessment.status !== 'ready') {
                try {
                    console.log('Checking backend for updates:', diagnosisId);
                    const diagnosisResponse = await getDiagnosis(undefined, undefined, {
                        diagnosisId
                    });

                    const diagnosis = diagnosisResponse.data;

                    // Only update if backend has preliminary diagnosis ready
                    if (diagnosis.preliminary?.possibleReasons?.length > 0) {
                        const possibleReasons = diagnosis.preliminary.possibleReasons;
                        const topReason = possibleReasons[0];

                        aiAssessment = {
                            status: 'ready',
                            diagnosis: topReason.title || diagnosis.fault,
                            confidence: topReason.probability === 'Alta' ? 85 :
                                        topReason.probability === 'Media' ? 65 : 45,
                            recommendation: determineRecommendation(diagnosis.preliminary),
                            reasoning: possibleReasons.map((r: any) => r.reasonDetails).filter(Boolean),
                            clientProgress: { answered: answeredCount, total: totalQuestions },
                        };

                        // Save to localStorage for future use
                        clientCases[opCase.id].aiAssessment = aiAssessment;
                        localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                        console.log('Backend diagnosis READY, saved to localStorage');
                    }
                } catch (apiError) {
                    console.log('Backend not available, using localStorage data');
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
            if (isInitialLoad) {
                setError('Error al cargar el caso');
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
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
                case 'repair-failed':
                    // New status: repair was attempted but failed
                    // Gruista can still escalate to tow from this state
                    newStatus = 'repair-attempted';
                    successMessage = '⚠️ Intento de reparación registrado. Puedes remolcar si es necesario.';
                    break;
                case 'tow':
                    newStatus = 'towing';
                    successMessage = '🚛 Caso marcado para remolque';
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
                    newStatus === 'repair-attempted' ? 'repair-attempted' :
                        newStatus;

                const updatedCases = operatorCases.map((c: any) =>
                    c.id === caseData.id
                        ? {
                            ...c,
                            status: operatorStatus,
                            updatedAt: new Date(),
                            // Track repair attempt for escalation
                            ...(decision === 'repair-failed' && {
                                repairAttempt: {
                                    attemptedAt: new Date(),
                                    notes: notes || '',
                                    failureReason: notes || 'No especificado',
                                    escalatedToTow: false
                                }
                            }),
                            // Mark escalation if going from repair-attempted to tow
                            ...(decision === 'tow' && c.repairAttempt && {
                                repairAttempt: {
                                    ...c.repairAttempt,
                                    escalatedToTow: true
                                }
                            })
                        }
                        : c
                );

                // Save back to operator cases
                localStorage.setItem('carretera_operator_cases', JSON.stringify(updatedCases));

                // Update local state with repair attempt info
                const updatedCaseData: GruistaCaseDetailed = {
                    ...caseData,
                    status: newStatus,
                    updatedAt: new Date(),
                    ...(decision === 'repair-failed' && {
                        repairAttempt: {
                            attemptedAt: new Date(),
                            notes: notes || '',
                            failureReason: notes || 'No especificado',
                            escalatedToTow: false
                        }
                    })
                };
                setCaseData(updatedCaseData);
            }

            // Create workshop case when towing (including escalation from repair-failed)
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

    /**
     * Generate a secure workshop link with scoped access token
     * The token is limited to this specific case and cannot be used elsewhere
     */
    const generateWorkshopLink = useCallback(async (): Promise<string> => {
        if (!caseData) return '';

        // Get diagnosisId and carId from localStorage
        const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
        const clientCase = clientCases[caseData.id] || {};

        // Generate scoped token for workshop access
        const workshopToken = await generateAccessToken('workshop', caseData.id, {
            carId: clientCase.carId,
            diagnosisId: clientCase.diagnosisId,
        });

        return getPublicClientUrl(`/carretera/t/${caseData.id}?token=${encodeURIComponent(workshopToken)}`);
    }, [caseData]);

    // Manual refresh function
    const refresh = async () => {
        if (caseId) {
            await loadCase(caseId, false);
        }
    };

    return {
        caseData,
        isLoading,
        error,
        submitDecision,
        isSubmitting,
        generateWorkshopLink,
        refresh,
        isRefreshing,
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
