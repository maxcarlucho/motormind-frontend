import { useState, useEffect, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CarreteraAssessment } from '../types/carretera.types';

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
 * MVP version using localStorage
 */
export function useClientAssessment(assessmentId: string | undefined): UseClientAssessmentReturn {
    const [assessment, setAssessment] = useState<CarreteraAssessment | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 300));

                // Load from localStorage
                const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                const caseData = clientCases[assessmentId];

                if (!caseData) {
                    throw new Error('Caso no encontrado');
                }

                // Create assessment from stored data
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
            } catch (err) {
                console.error('Error loading assessment:', err);
                setError('Error al cargar los datos. Por favor, verifica el enlace.');
                enqueueSnackbar('Error al cargar la evaluación', { variant: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        loadAssessment();
    }, [assessmentId]);

    // Submit a new answer
    const submitAnswer = useCallback(async (answer: string) => {
        if (!assessment) {
            enqueueSnackbar('No hay evaluación cargada', { variant: 'error' });
            return;
        }

        try {
            // Optimistically update local state
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            // TODO: Call backend API to save answer when endpoint is available
            // For now, we just update local state
            // await damageAssessmentApi.saveAnswer(assessment.id, answer);

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
    }, [assessment, answers, questions.length]);

    // Mark assessment as complete
    const markComplete = useCallback(async () => {
        if (!assessment) {
            enqueueSnackbar('No hay evaluación cargada', { variant: 'error' });
            return;
        }

        try {
            setIsLoading(true);

            // TODO: Call backend API to mark as complete when endpoint is available
            // await damageAssessmentApi.markComplete(assessment.id);

            setIsComplete(true);
            enqueueSnackbar('¡Gracias! La grúa está en camino', { variant: 'success' });
        } catch (err) {
            console.error('Error marking complete:', err);
            enqueueSnackbar('Error al finalizar', { variant: 'error' });
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [assessment]);

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
