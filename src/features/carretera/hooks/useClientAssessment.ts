import { useState, useEffect, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CarreteraAssessment } from '../types/carretera.types';
import { useApi } from '@/hooks/useApi';
import { Diagnosis } from '@/types/Diagnosis';

interface UseClientAssessmentReturn {
    assessment: CarreteraAssessment | null;
    questions: string[];
    answers: string[];
    isLoading: boolean;
    isComplete: boolean;
    error: string | null;
    submitAnswer: (answer: string) => Promise<void>;
    markComplete: () => Promise<void>;
}

// Preguntas predefinidas para el diagnóstico
const DIAGNOSTIC_QUESTIONS = [
    "¿Qué síntoma presenta el vehículo?",
    "¿Cuándo comenzó el problema?",
    "¿El vehículo hace algún ruido extraño?",
    "¿Has notado algún olor inusual?",
    "¿El problema es constante o intermitente?",
    "¿Puedes mover el vehículo o está completamente detenido?"
];

/**
 * Hook to manage client assessment state and interactions
 * Connects with real diagnosis API from core
 */
export function useClientAssessment(assessmentId: string | undefined): UseClientAssessmentReturn {
    const [assessment, setAssessment] = useState<CarreteraAssessment | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
    const [carId, setCarId] = useState<string | null>(null);

    // API hooks for core diagnosis system
    const { execute: getDiagnosis } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');
    const { execute: updateDiagnosis } = useApi<Diagnosis>('put', '/cars/diagnosis/:diagnosisId');
    const { execute: generatePreliminary } = useApi<Diagnosis>('post', '/cars/:carId/diagnosis/:diagnosisId/preliminary');

    // Helper function to load local data as fallback - moved outside useEffect
    const loadLocalData = (caseData: any) => {
        if (!caseData) {
            throw new Error('Caso no encontrado');
        }

        const carreteraAssessment: CarreteraAssessment = {
            id: caseData.id,
            clientName: caseData.clientName,
            clientPhone: caseData.clientPhone,
            symptom: caseData.symptom,
            questions: caseData.questions && caseData.questions.length > 0 ? caseData.questions : DIAGNOSTIC_QUESTIONS,
            answers: caseData.answers || [],
            status: caseData.status || 'pending',
            createdAt: new Date(caseData.createdAt),
            updatedAt: new Date(caseData.updatedAt),
            vehicleInfo: {
                plate: caseData.vehiclePlate,
            },
        };

        setAssessment(carreteraAssessment);
        setQuestions(carreteraAssessment.questions);
        setAnswers(carreteraAssessment.answers);
        setIsComplete(carreteraAssessment.status === 'completed');
    };

    // Load assessment data on mount or when ID changes
    useEffect(() => {

        const loadAssessment = async () => {
            if (!assessmentId) {
                setError('No se proporcionó ID de evaluación');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // First, try to get from localStorage to get diagnosis ID
                const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                const localCaseData = clientCases[assessmentId];

                if (localCaseData?.diagnosisId) {
                    // We have a diagnosis ID, fetch real data from core
                    try {
                        // Skip API call if we don't have a token (client in incognito)
                        const token = localStorage.getItem('token');
                        if (!token) {
                            console.log('No auth token, using local data only');
                            loadLocalData(localCaseData);
                            return;
                        }

                        const diagnosisResponse = await getDiagnosis(undefined, undefined, {
                            diagnosisId: localCaseData.diagnosisId
                        });

                        const diagnosis = diagnosisResponse.data;
                        setDiagnosisId(diagnosis._id || null);
                        setCarId(diagnosis.car?._id || null);

                        // Extract questions from diagnosis
                        const diagnosisQuestions = diagnosis.questions || DIAGNOSTIC_QUESTIONS;
                        const diagnosisAnswers = diagnosis.answers ? diagnosis.answers.split('|') : [];

                        // Create assessment from real diagnosis data
                        const carreteraAssessment: CarreteraAssessment = {
                            id: assessmentId,
                            clientName: localCaseData.clientName,
                            clientPhone: localCaseData.clientPhone,
                            symptom: diagnosis.fault || localCaseData.symptom,
                            questions: diagnosisQuestions,
                            answers: diagnosisAnswers,
                            status: diagnosis.status === 'completed' ? 'completed' : 'in-progress',
                            createdAt: new Date(diagnosis.createdAt || localCaseData.createdAt),
                            updatedAt: new Date(diagnosis.updatedAt || localCaseData.updatedAt),
                            vehicleInfo: {
                                plate: diagnosis.car?.plate || localCaseData.vehiclePlate,
                            },
                        };

                        setAssessment(carreteraAssessment);
                        setQuestions(diagnosisQuestions);
                        setAnswers(diagnosisAnswers);
                        setIsComplete(diagnosisAnswers.length >= diagnosisQuestions.length);
                    } catch (apiError) {
                        console.log('Could not fetch from core API, using local data');
                        // Fallback to local data
                        loadLocalData(localCaseData);
                    }
                } else {
                    // No diagnosis ID yet, use local data
                    loadLocalData(localCaseData);
                }
            } catch (err) {
                console.error('Error loading assessment:', err);
                setError('Error al cargar la evaluación');
                enqueueSnackbar('Error al cargar la evaluación', { variant: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        loadAssessment();
    }, [assessmentId]); // Only depend on assessmentId to avoid infinite loops

    // Submit a new answer and save to core diagnosis
    const submitAnswer = useCallback(async (answer: string) => {
        if (!assessment) {
            enqueueSnackbar('No hay evaluación cargada', { variant: 'error' });
            return;
        }

        try {
            // Optimistically update local state
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            // Save to core diagnosis if we have a diagnosis ID and token
            const token = localStorage.getItem('token');
            if (diagnosisId && token) {
                try {
                    await updateDiagnosis(
                        {
                            answers: newAnswers.join('|'), // Core expects pipe-separated answers
                            questions: questions,
                        },
                        undefined,
                        { diagnosisId }
                    );
                } catch (apiError) {
                    console.log('Could not save to core API, continuing with local storage');
                }
            }

            // Also update localStorage
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            if (clientCases[assessment.id]) {
                clientCases[assessment.id].answers = newAnswers;
                localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
            }

            // Check if all questions are answered
            if (newAnswers.length >= questions.length) {
                setIsComplete(true);
            }

            enqueueSnackbar('Respuesta guardada', { variant: 'success' });
        } catch (err) {
            console.error('Error submitting answer:', err);
            enqueueSnackbar('Error al guardar respuesta', { variant: 'error' });
            // Revert optimistic update
            setAnswers(answers);
            throw err;
        }
    }, [assessment, answers, questions, diagnosisId, updateDiagnosis]);

    // Mark assessment as complete and generate pre-diagnosis (without OBD)
    const markComplete = useCallback(async () => {
        if (!assessment) {
            enqueueSnackbar('No hay evaluación cargada', { variant: 'error' });
            return;
        }

        try {
            setIsLoading(true);

            // Generate preliminary diagnosis without OBD codes (only if authenticated)
            const token = localStorage.getItem('token');
            if (diagnosisId && carId && token) {
                try {
                    const preliminaryResponse = await generatePreliminary(
                        {
                            obdCodes: [], // No OBD codes for pre-diagnosis
                        },
                        undefined,
                        { carId, diagnosisId }
                    );

                    console.log('Pre-diagnosis generated:', preliminaryResponse.data);

                    // Extract AI assessment from the backend response
                    const backendDiagnosis = preliminaryResponse.data;
                    // possibleReasons are in 'preliminary' field, not 'processedFault'
                    const preliminary = backendDiagnosis.preliminary;
                    const possibleReasons = preliminary?.possibleReasons || [];
                    const topReason = possibleReasons[0];

                    // Build aiAssessment from backend data
                    const aiAssessment = {
                        diagnosis: topReason?.title ||
                                   backendDiagnosis.fault ||
                                   assessment.symptom,
                        confidence: topReason?.probability === 'Alta' ? 85 :
                                    topReason?.probability === 'Media' ? 65 : 45,
                        recommendation: determineRecommendationFromPreliminary(preliminary),
                        reasoning: possibleReasons.map((r: any) => r.reasonDetails).filter(Boolean) ||
                                   ['Diagnóstico generado por IA basado en síntomas reportados'],
                        // Store full backend data for detailed view
                        possibleReasons: possibleReasons,
                        rawDiagnosis: backendDiagnosis,
                    };

                    // Update local state
                    setIsComplete(true);

                    // Store the generated diagnosis info AND aiAssessment for Gruista
                    const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                    if (clientCases[assessment.id]) {
                        clientCases[assessment.id].status = 'completed';
                        clientCases[assessment.id].preDiagnosisGenerated = true;
                        clientCases[assessment.id].aiAssessment = aiAssessment;
                        clientCases[assessment.id].answers = answers; // Ensure answers are saved
                        localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                    }

                    // Also update operator cases status
                    const operatorCases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
                    const updatedOperatorCases = operatorCases.map((c: any) =>
                        c.id === assessment.id
                            ? { ...c, status: 'in-progress', updatedAt: new Date().toISOString() }
                            : c
                    );
                    localStorage.setItem('carretera_operator_cases', JSON.stringify(updatedOperatorCases));

                    enqueueSnackbar('✅ Evaluación completada. La grúa está en camino', {
                        variant: 'success',
                        autoHideDuration: 5000
                    });
                } catch (apiError) {
                    console.log('Could not generate preliminary diagnosis, marking complete locally');
                    // Fallback to local completion with default assessment
                    setIsComplete(true);

                    const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                    if (clientCases[assessment.id]) {
                        clientCases[assessment.id].status = 'completed';
                        clientCases[assessment.id].answers = answers;
                        // Generate a basic aiAssessment based on symptom when API fails
                        clientCases[assessment.id].aiAssessment = {
                            diagnosis: `Diagnóstico pendiente para: ${assessment.symptom}`,
                            confidence: 50,
                            recommendation: 'tow', // Default to tow for safety
                            reasoning: ['Diagnóstico automático no disponible', 'Se recomienda inspección en taller'],
                        };
                        localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                    }

                    enqueueSnackbar('✅ Evaluación completada', { variant: 'success' });
                }
            } else {
                // No diagnosis ID, just mark complete locally
                setIsComplete(true);

                const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                if (clientCases[assessment.id]) {
                    clientCases[assessment.id].status = 'completed';
                    clientCases[assessment.id].answers = answers;
                    // Generate a basic aiAssessment
                    clientCases[assessment.id].aiAssessment = {
                        diagnosis: `Evaluación completada: ${assessment.symptom}`,
                        confidence: 40,
                        recommendation: 'tow',
                        reasoning: ['Cliente completó cuestionario', 'Requiere evaluación del gruista'],
                    };
                    localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                }

                enqueueSnackbar('✅ Evaluación completada', { variant: 'success' });
            }
        } catch (err) {
            console.error('Error marking complete:', err);
            enqueueSnackbar('Error al finalizar la evaluación', { variant: 'error' });
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [assessment, diagnosisId, carId, answers, generatePreliminary]);

    // Helper function to determine recommendation based on backend preliminary diagnosis
    function determineRecommendationFromPreliminary(preliminary: any): 'repair' | 'info' | 'tow' {
        if (!preliminary || !preliminary.possibleReasons) {
            return 'tow'; // Default to tow for safety
        }

        const topReason = preliminary.possibleReasons[0];
        if (!topReason) return 'tow';

        // Check if required tools are simple (can repair on-site)
        const simpleTools = ['llave', 'destornillador', 'multímetro', 'cables de arranque', 'pinzas'];
        const requiredTools = topReason.requiredTools || [];
        const hasSimpleTools = requiredTools.length === 0 || requiredTools.every((tool: string) =>
            simpleTools.some(simple => tool.toLowerCase().includes(simple))
        );

        // High probability + simple tools = can repair on-site
        if (topReason.probability === 'Alta' && hasSimpleTools && requiredTools.length <= 2) {
            return 'repair';
        }

        // Medium probability = needs more info
        if (topReason.probability === 'Media') {
            return 'info';
        }

        // Default to tow for complex repairs
        return 'tow';
    }

    return {
        assessment,
        questions,
        answers,
        isLoading,
        isComplete,
        error,
        submitAnswer,
        markComplete,
    };
}