import { useState, useEffect, useCallback, useRef } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CarreteraAssessment } from '../types/carretera.types';
import { Diagnosis } from '@/types/Diagnosis';
import carreteraApi from '../services/carreteraApi.service';

interface UseClientAssessmentReturn {
    assessment: CarreteraAssessment | null;
    questions: string[];
    answers: string[];
    isLoading: boolean;
    isComplete: boolean;
    isGeneratingDiagnosis: boolean; // True while generating preliminary diagnosis
    error: string | null;
    submitAnswer: (answer: string) => Promise<void>;
    markComplete: () => Promise<void>;
}

interface ClientAssessmentOptions {
    carId?: string;       // Car ID from validated scoped token
    diagnosisId?: string; // Diagnosis ID from validated scoped token
    urlToken?: string;    // Scoped token from URL (for incognito access)
}

// Default questions if none are provided - optimized for roadside assistance
// These questions help determine if the issue can be fixed on-site or requires towing
const DIAGNOSTIC_QUESTIONS = [
    "¿El motor arranca o no arranca en absoluto?",
    "¿Hay algún testigo o luz de avería encendida en el tablero?",
    "¿El problema ocurrió de repente o fue gradual?",
    "¿Puedes mover el vehículo aunque sea unos metros?",
    "¿Estás en un lugar seguro mientras esperas?"
];

/**
 * Hook to manage client assessment state and interactions
 *
 * Security: Token validation is handled by RequireAccessToken component.
 * This hook receives pre-validated carId and diagnosisId from the scoped token.
 */
export function useClientAssessment(
    assessmentId: string | undefined,
    options: ClientAssessmentOptions = {}
): UseClientAssessmentReturn {
    const [assessment, setAssessment] = useState<CarreteraAssessment | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
    const [carId, setCarId] = useState<string | null>(null);

    // Get carId and diagnosisId from validated token (passed from RequireAccessToken context)
    const tokenCarId = options.carId;
    const tokenDiagnosisId = options.diagnosisId;
    const urlToken = options.urlToken;

    // Use ref to track if we've already generated preliminary
    const preliminaryGeneratedRef = useRef(false);

    // Set up scoped token for incognito access on mount
    useEffect(() => {
        if (urlToken) {
            console.log('🔐 Setting scoped token for incognito API access');
            carreteraApi.setScopedToken(urlToken);
        }
        return () => {
            // Clean up on unmount
            carreteraApi.setScopedToken(null);
        };
    }, [urlToken]);

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

        // Set IDs from local data or token
        if (caseData.diagnosisId || tokenDiagnosisId) setDiagnosisId(caseData.diagnosisId || tokenDiagnosisId);
        if (caseData.carId || tokenCarId) setCarId(caseData.carId || tokenCarId || null);
    }, [tokenCarId, tokenDiagnosisId]);

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

                // Try to get from localStorage first (operator's browser has this)
                const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
                const localCaseData = clientCases[assessmentId];

                // Get IDs from token (works in incognito) or localStorage (works for operator)
                const effectiveCarId = tokenCarId || localCaseData?.carId;
                const effectiveDiagnosisId = tokenDiagnosisId || localCaseData?.diagnosisId;

                if (effectiveCarId) setCarId(effectiveCarId);
                if (effectiveDiagnosisId) setDiagnosisId(effectiveDiagnosisId);

                // If we have diagnosisId (from token or localStorage), fetch from backend
                // This works even in incognito mode since carreteraApi uses the scoped token
                if (effectiveDiagnosisId) {
                    try {
                        console.log('🔄 Fetching diagnosis from backend...', { effectiveDiagnosisId, effectiveCarId });
                        const diagnosis = await carreteraApi.getDiagnosis(effectiveDiagnosisId) as Diagnosis;

                        console.log('✅ Diagnosis fetched:', diagnosis);

                        // Extract questions from diagnosis
                        const diagnosisQuestions = diagnosis.questions || DIAGNOSTIC_QUESTIONS;
                        const diagnosisAnswers = diagnosis.answers ? diagnosis.answers.split('|') : [];

                        // Extract client info from diagnosis workflow or localStorage
                        // The workflow contains client data submitted during case creation
                        const workflow = (diagnosis as any).workflow || {};
                        const clientName = workflow.clientName || localCaseData?.clientName || 'Cliente';
                        const clientPhone = workflow.clientPhone || localCaseData?.clientPhone || '';
                        const symptom = diagnosis.fault || workflow.symptom || localCaseData?.symptom || 'Asistencia en carretera';

                        // Create assessment from backend diagnosis data
                        // Works in incognito because all data comes from backend
                        const carreteraAssessment: CarreteraAssessment = {
                            id: assessmentId,
                            clientName,
                            clientPhone,
                            symptom,
                            questions: diagnosisQuestions,
                            answers: diagnosisAnswers,
                            status: diagnosis.status === 'completed' ? 'completed' : 'in-progress',
                            createdAt: new Date(diagnosis.createdAt || Date.now()),
                            updatedAt: new Date(diagnosis.updatedAt || Date.now()),
                            vehicleInfo: {
                                plate: diagnosis.car?.plate || localCaseData?.vehiclePlate || '',
                            },
                        };

                        setAssessment(carreteraAssessment);
                        setQuestions(diagnosisQuestions);
                        setAnswers(diagnosisAnswers);

                        // Check if already complete: either has preliminary or all questions answered
                        const hasPreDiagnosis = !!diagnosis.preliminary?.possibleReasons?.length;
                        const allAnswered = diagnosisAnswers.length >= diagnosisQuestions.length;
                        setIsComplete(hasPreDiagnosis || allAnswered);

                        if (hasPreDiagnosis) {
                            console.log('✅ Pre-diagnosis already generated, marking as complete');
                        }

                        // Update carId from diagnosis if available
                        if (diagnosis.car?._id) setCarId(diagnosis.car._id);

                        // Data loaded from backend successfully
                        return;

                    } catch (apiError) {
                        console.log('⚠️ Could not fetch from backend:', apiError);
                        // If we have local data, use it as fallback
                        if (localCaseData) {
                            loadLocalData(localCaseData);
                            return;
                        }
                        // No backend and no local data - show error
                        setError('No se pudo cargar el caso. Verifica tu conexión.');
                    }
                } else if (localCaseData) {
                    // No diagnosisId but have local data - use it
                    console.log('📦 Using local data (no diagnosisId in token)');
                    loadLocalData(localCaseData);
                } else {
                    // No diagnosisId and no local data - can't load
                    setError('No se pudo cargar el caso.');
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
    }, [assessmentId, tokenCarId, tokenDiagnosisId, loadLocalData]);

    // Helper: Mark complete locally without backend AI
    const markCompleteLocally = useCallback((finalAnswers: string[], currentAssessment: CarreteraAssessment) => {
        setIsComplete(true);

        const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
        if (clientCases[currentAssessment.id]) {
            clientCases[currentAssessment.id].status = 'completed';
            clientCases[currentAssessment.id].answers = finalAnswers;
            clientCases[currentAssessment.id].aiAssessment = {
                status: 'ready' as const,
                diagnosis: `Evaluación completada: ${currentAssessment.symptom}`,
                confidence: 40,
                recommendation: 'tow' as const,
                reasoning: ['Cliente completó cuestionario', 'Requiere evaluación del gruista'],
                clientProgress: { answered: finalAnswers.length, total: questions.length },
            };
            localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
        }

        enqueueSnackbar('✅ Evaluación completada. La grúa está en camino.', { variant: 'success' });
    }, [questions.length]);

    // Helper function to determine recommendation
    const determineRecommendation = useCallback((preliminary: any): 'repair' | 'tow' => {
        if (!preliminary?.possibleReasons?.length) return 'tow';

        const topReason = preliminary.possibleReasons[0];
        const requiredTools = topReason.requiredTools || [];
        const simpleTools = ['llave', 'destornillador', 'multímetro', 'cables', 'pinzas', 'batería', 'cargador'];

        const hasSimpleTools = requiredTools.length === 0 || requiredTools.every((tool: string) =>
            simpleTools.some(simple => tool.toLowerCase().includes(simple))
        );

        if (topReason.probability === 'Alta' && hasSimpleTools && requiredTools.length <= 2) {
            return 'repair';
        }

        if (topReason.probability === 'Media' && hasSimpleTools && requiredTools.length <= 1) {
            return 'repair';
        }

        return 'tow';
    }, []);

    // Generate preliminary diagnosis when client finishes all questions
    const generatePreliminaryDiagnosis = useCallback(async (finalAnswers: string[]) => {
        if (!assessment || !diagnosisId) {
            console.log('⚠️ Cannot generate preliminary: missing assessment or diagnosisId');
            setIsComplete(true);
            return;
        }

        // Prevent duplicate generation
        if (preliminaryGeneratedRef.current) {
            console.log('⚠️ Preliminary already generated, skipping...');
            return;
        }

        const effectiveCarId = carId || tokenCarId;
        const hasAuthToken = carreteraApi.getAuthToken();

        if (!hasAuthToken || !effectiveCarId) {
            console.log('⚠️ Cannot generate preliminary: missing token or carId');
            // Mark as complete locally without AI diagnosis
            markCompleteLocally(finalAnswers, assessment);
            return;
        }

        try {
            preliminaryGeneratedRef.current = true;
            setIsGeneratingDiagnosis(true);
            console.log('🤖 Generating preliminary diagnosis...');
            console.log('   - diagnosisId:', diagnosisId);
            console.log('   - carId:', effectiveCarId);
            console.log('   - incognito mode:', carreteraApi.isIncognitoMode());

            // First ensure answers are saved to backend
            // Works in incognito mode using scoped token
            await carreteraApi.saveAnswers(
                effectiveCarId,
                diagnosisId,
                finalAnswers.join('|')
            );
            console.log('✅ Answers saved to backend');

            // Generate preliminary diagnosis
            // Works in incognito mode using scoped token
            const diagnosis = await carreteraApi.generatePreliminary(
                effectiveCarId,
                diagnosisId,
                [] // No OBD codes for pre-diagnosis
            ) as Diagnosis;

            console.log('✅ Preliminary diagnosis generated:', diagnosis);

            // Extract AI assessment from backend response
            const preliminary = diagnosis.preliminary;
            const possibleReasons = preliminary?.possibleReasons || [];
            const topReason = possibleReasons[0];

            // Build aiAssessment from backend data
            const aiAssessment = {
                status: 'ready' as const,
                diagnosis: topReason?.title || diagnosis.fault || assessment.symptom,
                confidence: topReason?.probability === 'Alta' ? 85 :
                            topReason?.probability === 'Media' ? 65 : 45,
                recommendation: determineRecommendation(preliminary),
                reasoning: possibleReasons.map((r: any) => r.reasonDetails).filter(Boolean) ||
                           ['Diagnóstico generado por IA'],
                clientProgress: { answered: finalAnswers.length, total: questions.length },
                possibleReasons: possibleReasons,
            };

            // Update localStorage for Gruista to see
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            if (clientCases[assessment.id]) {
                clientCases[assessment.id].status = 'completed';
                clientCases[assessment.id].preDiagnosisGenerated = true;
                clientCases[assessment.id].aiAssessment = aiAssessment;
                clientCases[assessment.id].answers = finalAnswers;
                localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
            }

            // Update operator cases status
            const operatorCases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
            const updatedOperatorCases = operatorCases.map((c: any) =>
                c.id === assessment.id
                    ? { ...c, status: 'in-progress', updatedAt: new Date().toISOString() }
                    : c
            );
            localStorage.setItem('carretera_operator_cases', JSON.stringify(updatedOperatorCases));

            setIsGeneratingDiagnosis(false);
            setIsComplete(true);
            enqueueSnackbar('✅ ¡Gracias! El diagnóstico ha sido generado. La grúa está en camino.', {
                variant: 'success',
                autoHideDuration: 5000
            });

        } catch (err: any) {
            console.error('❌ Error generating preliminary:', err);
            console.error('   Status:', err?.response?.status);
            console.error('   Data:', err?.response?.data);
            console.error('   Message:', err?.message);
            setIsGeneratingDiagnosis(false);
            preliminaryGeneratedRef.current = false; // Allow retry
            // Mark complete locally as fallback
            markCompleteLocally(finalAnswers, assessment);
        }
    }, [assessment, diagnosisId, carId, tokenCarId, questions, markCompleteLocally, determineRecommendation]);

    // Submit a new answer and save to backend
    const submitAnswer = useCallback(async (answer: string) => {
        if (!assessment) {
            enqueueSnackbar('No hay evaluación cargada', { variant: 'error' });
            return;
        }

        try {
            // Optimistically update local state
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            // Save to backend if we have diagnosisId and carId
            // Works in incognito mode using the scoped token from URL
            const effectiveCarId = carId || tokenCarId;
            if (diagnosisId && effectiveCarId && carreteraApi.getAuthToken()) {
                try {
                    console.log('📤 Saving answer to backend...');
                    // Correct endpoint: PUT /cars/:carId/diagnosis/:diagnosisId/answers
                    await carreteraApi.saveAnswers(
                        effectiveCarId,
                        diagnosisId,
                        newAnswers.join('|') // Core expects pipe-separated answers
                    );
                    console.log('✅ Answer saved to backend');
                } catch (apiError: any) {
                    console.log('⚠️ Could not save to backend, continuing with localStorage');
                    console.log('   Error:', apiError?.response?.status, apiError?.response?.data || apiError?.message);
                }
            }

            // Also update localStorage (for offline support and Gruista polling)
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            if (clientCases[assessment.id]) {
                clientCases[assessment.id].answers = newAnswers;
                localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
            }

            // Check if all questions are answered - if so, auto-generate preliminary
            if (newAnswers.length >= questions.length) {
                console.log('🎯 All questions answered! Generating preliminary diagnosis...');
                await generatePreliminaryDiagnosis(newAnswers);
            }
            // No snackbar for each answer - it's distracting for the client
        } catch (err) {
            console.error('Error submitting answer:', err);
            enqueueSnackbar('Error al guardar respuesta', { variant: 'error' });
            // Revert optimistic update
            setAnswers(answers);
            throw err;
        }
    }, [assessment, answers, questions, diagnosisId, carId, tokenCarId, generatePreliminaryDiagnosis]);

    // Manual mark complete (legacy, now auto-triggered)
    const markComplete = useCallback(async () => {
        if (!assessment) return;
        await generatePreliminaryDiagnosis(answers);
    }, [assessment, answers, generatePreliminaryDiagnosis]);

    return {
        assessment,
        questions,
        answers,
        isLoading,
        isComplete,
        isGeneratingDiagnosis,
        error,
        submitAnswer,
        markComplete,
    };
}
