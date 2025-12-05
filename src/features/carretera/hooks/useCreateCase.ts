import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CaseFormData, OperatorCase } from '../types/carretera.types';
import { useApi } from '@/hooks/useApi';
import { Car } from '@/types/Car';
import { Diagnosis } from '@/types/Diagnosis';
import carreteraApi from '../services/carreteraApi.service';
import { generateAccessToken } from '../utils/accessToken';

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

            // Calcular caseNumber y caseCount aquí para que estén disponibles en todo el scope
            const caseCount = JSON.parse(localStorage.getItem('carretera_case_count') || '0') + 1;
            const caseNumber = `C-${String(caseCount).padStart(3, '0')}`;

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

                // WORKAROUND: El backend NO usa el campo "notes" en el prompt de generación de preguntas
                // (ver FLUJO_DIAGNOSTICO_IA.md v2.3 - Bug documentado)
                // Solución temporal: Incluir el contexto de carretera DENTRO del síntoma (fault)
                // ya que {FAULT} sí se usa en el prompt template del backend

                // Contexto conciso para incluir en el síntoma
                const roadsideContextForFault = `[ASISTENCIA CARRETERA - Cliente varado, preguntas rápidas para decidir: REPARAR IN-SITU o REMOLCAR]`;

                // Síntoma enriquecido con contexto de carretera
                const enrichedSymptom = `${data.symptom}\n\n${roadsideContextForFault}`;

                // JSON estructurado para datos de carretera (persistido en MongoDB via notes)
                // caseNumber ya está calculado arriba
                const carreteraData = {
                    carretera: {
                        caseNumber,
                        clientName: data.clientName,
                        clientPhone: data.clientPhone,
                        location: data.location || 'No especificada',
                        status: 'pending',
                        operatorNotes: data.notes || '',
                        createdAt: new Date().toISOString(),
                    }
                };

                // Guardamos JSON en notes para persistencia en MongoDB
                const additionalNotes = JSON.stringify(carreteraData);

                const diagnosisResponse = await createDiagnosis(
                    {
                        fault: enrichedSymptom,
                        notes: additionalNotes
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

            // Use diagnosisId directly as caseId to avoid confusion
            const caseId = diagnosisId;

            // Generate SCOPED tokens for client and workshop
            // These tokens are LIMITED - they only grant access to THIS specific case
            // They do NOT expose the operator's full JWT token
            const clientToken = await generateAccessToken('client', caseId, {
                carId: carId || undefined,
                diagnosisId,
            });
            const workshopToken = await generateAccessToken('workshop', caseId, {
                carId: carId || undefined,
                diagnosisId,
            });

            // Build secure links with scoped tokens
            const clientLink = `/carretera/c/${caseId}?token=${encodeURIComponent(clientToken)}`;
            const workshopLink = `/carretera/t/${caseId}?token=${encodeURIComponent(workshopToken)}`;

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
                clientLink, // URL with SCOPED token (not operator JWT!)
                workshopLink, // URL with SCOPED token for workshop access
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

            // Try to sync with carretera backend (non-blocking)
            try {
                const isBackendAvailable = await carreteraApi.healthCheck().catch(() => false);
                if (isBackendAvailable) {
                    await carreteraApi.createCase({
                        ...data,
                        diagnosisId,
                        clientLink,
                        workshopLink,
                    } as any);
                    console.log('Case synced with carretera backend');
                }
            } catch (syncError) {
                console.log('Could not sync with carretera backend:', syncError);
            }

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
