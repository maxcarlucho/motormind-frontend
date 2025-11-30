import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CaseFormData, OperatorCase } from '../types/carretera.types';
import { useApi } from '@/hooks/useApi';
import { Car } from '@/types/Car';
import { Diagnosis } from '@/types/Diagnosis';
import carreteraApi from '../services/carreteraApi.service';

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

    // Use the correct APIs for diagnosis
    // GET /cars/vin-or-plate automatically gets vehicle data from TecDoc by plate
    const { execute: getOrCreateVehicle } = useApi<Car>('get', '/cars/vin-or-plate');
    const { execute: createDiagnosis } = useApi<Diagnosis>('post', '/cars/:carId/questions');

    const createCase = async (data: CaseFormData): Promise<string> => {
        try {
            setIsCreating(true);
            setError(null);

            let diagnosisId: string;
            let carId: string | null = null;
            let generatedQuestions: string[] = [];

            try {
                // Step 1: Get or create vehicle by license plate using TecDoc
                // The backend automatically fetches vehicle data from TecDoc API
                console.log('🚗 Step 1: Looking up vehicle by plate (TecDoc):', data.vehiclePlate);

                const vehicleResponse = await getOrCreateVehicle(undefined, {
                    plate: data.vehiclePlate.toUpperCase()
                });

                if (!vehicleResponse?.data?._id) {
                    throw new Error('No vehicle ID returned from TecDoc lookup');
                }

                carId = vehicleResponse.data._id;
                const vehicleData = vehicleResponse.data;
                console.log('✅ Vehicle found/created:', carId);
                console.log('🚗 Vehicle data from TecDoc:', {
                    brand: vehicleData.brand,
                    model: vehicleData.model,
                    year: vehicleData.year,
                    plate: vehicleData.plate
                });

                // Step 2: Create diagnosis for this vehicle
                console.log('📋 Step 2: Creating diagnosis for vehicle');

                // IMPORTANTE: Contexto de servicio en carretera
                // El vehículo está VARADO, necesitamos:
                // 1. Preguntas rápidas y enfocadas (no diagnóstico extenso de taller)
                // 2. Determinar si es reparable in-situ o requiere remolque
                // 3. Priorizar seguridad del cliente
                const roadsideContext = `
CONTEXTO CRÍTICO: SERVICIO DE ASISTENCIA EN CARRETERA
- El vehículo está VARADO y el cliente espera en el lugar
- Objetivo: Determinar rápidamente si el problema es reparable in-situ o requiere remolque al taller
- Las preguntas deben ser CONCISAS y orientadas a:
  * Identificar síntomas clave para diagnóstico rápido
  * Evaluar si el gruista puede resolver con herramientas básicas
  * Determinar urgencia y seguridad del cliente
- NO hacer preguntas extensas de taller, solo lo esencial para decidir: REPARAR IN-SITU o REMOLCAR

Datos del servicio:
- Cliente: ${data.clientName}
- Teléfono: ${data.clientPhone}
- Ubicación: ${data.location || 'No especificada'}
${data.notes ? `- Notas adicionales: ${data.notes}` : ''}
`.trim();

                const diagnosisResponse = await createDiagnosis(
                    {
                        fault: data.symptom,
                        notes: roadsideContext
                    },
                    undefined,
                    { carId }
                );

                if (!diagnosisResponse?.data?._id) {
                    throw new Error('No diagnosis ID returned');
                }

                diagnosisId = diagnosisResponse.data._id;
                generatedQuestions = diagnosisResponse.data.questions || [];
                console.log('✅ Diagnosis created successfully:', diagnosisId);
                console.log('✅ Questions generated:', generatedQuestions.length);

            } catch (apiError: any) {
                console.warn('⚠️ Could not create diagnosis in core system');
                console.warn('Error details:', apiError);

                if (apiError.response) {
                    console.warn('Response status:', apiError.response.status);
                    console.warn('Response data:', apiError.response.data);

                    // Show specific error messages
                    if (apiError.response.status === 401) {
                        enqueueSnackbar('⚠️ No autorizado. Por favor, inicia sesión nuevamente.', {
                            variant: 'warning'
                        });
                    } else if (apiError.response.status === 404) {
                        enqueueSnackbar('⚠️ Servicio no disponible', {
                            variant: 'warning'
                        });
                    } else if (apiError.response.status === 400) {
                        enqueueSnackbar('⚠️ Error en los datos. Verifica la información.', {
                            variant: 'warning'
                        });
                    }
                } else if (apiError.request) {
                    console.warn('No response received. Backend might be down.');
                    enqueueSnackbar('⚠️ Servidor no disponible. Usando modo offline.', {
                        variant: 'info'
                    });
                }

                // If core API fails, generate a local ID and continue
                // This allows the system to work even if core is down
                const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                diagnosisId = `local-${uniqueId}`;
                console.log('📝 Using local diagnosis ID:', diagnosisId);
                // Use default questions when API fails - optimized for roadside assistance
                generatedQuestions = [
                    "¿El motor arranca o no arranca en absoluto?",
                    "¿Hay algún testigo o luz de avería encendida en el tablero?",
                    "¿El problema ocurrió de repente o fue gradual?",
                    "¿Puedes mover el vehículo aunque sea unos metros?",
                    "¿Estás en un lugar seguro mientras esperas?"
                ];
            }

            // Step 2: Try to create case in carretera backend
            // If carretera backend is available, use it. Otherwise, fallback to localStorage
            try {
                // Check if carretera backend is available
                const isBackendAvailable = await carreteraApi.healthCheck().catch(() => false);

                if (isBackendAvailable) {
                    // Use real backend
                    const caseWithDiagnosis = {
                        ...data,
                        diagnosisId // Link to core diagnosis
                    } as any;
                    const response = await carreteraApi.createCase(caseWithDiagnosis);

                    setCreatedCaseId(response.data.id);
                    enqueueSnackbar(`✅ Caso ${response.data.caseNumber} creado exitosamente`, {
                        variant: 'success'
                    });

                    return response.data.id;
                }
            } catch (apiError) {
                console.log('Carretera backend not available, using localStorage fallback');
            }

            // Fallback: Use localStorage if carretera backend is not available
            // Use diagnosisId directly as caseId to avoid confusion
            const caseId = diagnosisId;
            const caseCount = JSON.parse(localStorage.getItem('carretera_case_count') || '0') + 1;
            const caseNumber = `C-${String(caseCount).padStart(3, '0')}`;

            // Generate client URL with token for API access
            // The client needs this token to save answers and generate preliminary diagnosis
            const operatorToken = localStorage.getItem('token') || '';
            const clientLink = operatorToken && carId
                ? `/carretera/c/${caseId}?t=${encodeURIComponent(operatorToken)}&car=${carId}`
                : `/carretera/c/${caseId}`;

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
                clientLink, // URL with token for client API access
                workshopLink: `/carretera/t/${caseId}`, // Add workshop link
                diagnosisId, // Store diagnosis ID reference
            } as OperatorCase & { diagnosisId: string };

            // Save to localStorage as fallback - avoid duplicates
            const existingCases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
            // Check if case already exists
            const existingIndex = existingCases.findIndex((c: any) => c.id === caseId);
            if (existingIndex >= 0) {
                // Update existing case instead of adding duplicate
                existingCases[existingIndex] = newCase;
            } else {
                // Add new case
                existingCases.unshift(newCase);
            }
            localStorage.setItem('carretera_operator_cases', JSON.stringify(existingCases));
            localStorage.setItem('carretera_case_count', JSON.stringify(caseCount));

            // Also create a client case entry
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            clientCases[caseId] = {
                ...newCase,
                questions: generatedQuestions, // Use the questions from the diagnosis
                answers: [],
                currentQuestionIndex: 0,
                diagnosisId,
                carId, // Store car ID for future API calls
            };
            localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));

            setCreatedCaseId(caseId);
            enqueueSnackbar(`✅ Caso ${caseNumber} creado exitosamente`, { variant: 'success' });

            return caseId;
        } catch (err) {
            console.error('Error creating case:', err);
            const errorMessage = 'Error al crear el caso. Por favor, intenta de nuevo.';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            // Don't re-throw if we managed to create a local case
            if (createdCaseId) {
                return createdCaseId;
            }
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
