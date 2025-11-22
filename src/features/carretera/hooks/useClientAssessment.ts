import { useState, useEffect, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CarreteraAssessment } from '../types/carretera.types';
import { useApi } from '@/hooks/useApi';
import { Diagnosis } from '@/types/Diagnosis';
import carreteraApi from '../services/carreteraApi.service';

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
    const { execute: updateDiagnosis } = useApi<Diagnosis>('patch', '/cars/diagnosis/:diagnosisId');
    const { execute: generatePreliminary } = useApi<Diagnosis>('post', '/cars/:carId/diagnosis/:diagnosisId/preliminary');

    // Helper function to load local data as fallback
    const loadLocalData = useCallback((caseData: any) => {
        if (!caseData) {
            throw new Error('Caso no encontrado');
        }

        const carreteraAssessment: CarreteraAssessment = {
            id: caseData.id,
            clientName: caseData.clientName,
            clientPhone: caseData.clientPhone,
            symptom: caseData.symptom,
            questions: caseData.questions.length > 0 ? caseData.questions : DIAGNOSTIC_QUESTIONS,
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
    }, []);

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
                        const diagnosisResponse = await getDiagnosis(undefined, undefined, {
                            diagnosisId: localCaseData.diagnosisId
                        });

                        const diagnosis = diagnosisResponse.data;
                        setDiagnosisId(diagnosis._id);
                        setCarId(diagnosis.car?._id || null);

                        // Extract questions from diagnosis
                        const diagnosisQuestions = diagnosis.questions || DIAGNOSTIC_QUESTIONS;
                        const diagnosisAnswers = diagnosis.answers ? diagnosis.answers.split('|') : [];

                        // Create assessment from real diagnosis data
                        const carreteraAssessment: CarreteraAssessment = {
                            id: assessmentId,
                            clientName: localCaseData.clientName,
                            clientPhone: localCaseData.clientPhone,
                            symptom: diagnosis.symptoms || localCaseData.symptom,
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
    }, [assessmentId, getDiagnosis, loadLocalData]);

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

            // Save to core diagnosis if we have a diagnosis ID
            if (diagnosisId) {
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

            // Generate preliminary diagnosis without OBD codes
            if (diagnosisId && carId) {
                try {
                    const preliminaryResponse = await generatePreliminary(
                        {
                            obdCodes: [], // No OBD codes for pre-diagnosis
                        },
                        undefined,
                        { carId, diagnosisId }
                    );

                    console.log('Pre-diagnosis generated:', preliminaryResponse.data);

                    // Update local state
                    setIsComplete(true);

                    // Store the generated diagnosis info
                    const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                    if (clientCases[assessment.id]) {
                        clientCases[assessment.id].status = 'completed';
                        clientCases[assessment.id].preDiagnosisGenerated = true;
                        localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
                    }

                    enqueueSnackbar('✅ Evaluación completada. La grúa está en camino', {
                        variant: 'success',
                        autoHideDuration: 5000
                    });
                } catch (apiError) {
                    console.log('Could not generate preliminary diagnosis, marking complete locally');
                    // Fallback to local completion
                    setIsComplete(true);
                    enqueueSnackbar('✅ Evaluación completada', { variant: 'success' });
                }
            } else {
                // No diagnosis ID, just mark complete locally
                setIsComplete(true);

                const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                if (clientCases[assessment.id]) {
                    clientCases[assessment.id].status = 'completed';
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
    }, [assessment, diagnosisId, carId, generatePreliminary]);

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