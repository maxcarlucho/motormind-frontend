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

    // Use the correct APIs for diagnosis (not damage-assessment)
    const { execute: getOrCreateVehicle } = useApi<Car>('get', '/cars/vin-or-plate');
    const { execute: createVehicle } = useApi<Car>('post', '/cars');
    const { execute: createDiagnosis } = useApi<Diagnosis>('post', '/cars/:carId/questions');

    const createCase = async (data: CaseFormData): Promise<string> => {
        try {
            setIsCreating(true);
            setError(null);

            let diagnosisId: string;
            let carId: string | null = null;

            try {
                // Step 1: Get or create vehicle by license plate
                console.log('🚗 Step 1: Looking up vehicle by plate:', data.vehiclePlate);

                let vehicleResponse;
                try {
                    // Try the get-or-create endpoint first
                    vehicleResponse = await getOrCreateVehicle(undefined, {
                        plate: data.vehiclePlate.toUpperCase()
                    });
                } catch (getError: any) {
                    // If get-or-create doesn't exist (404), create vehicle directly
                    if (getError.response?.status === 404) {
                        console.log('Get-or-create endpoint not found, creating vehicle directly');
                        vehicleResponse = await createVehicle({
                            plate: data.vehiclePlate.toUpperCase(),
                            brand: 'Unknown',
                            model: 'Unknown',
                            year: new Date().getFullYear().toString(),
                        });
                    } else {
                        throw getError;
                    }
                }

                if (!vehicleResponse?.data?._id) {
                    throw new Error('No vehicle ID returned');
                }

                carId = vehicleResponse.data._id;
                console.log('✅ Vehicle found/created:', carId);

                // Step 2: Create diagnosis for this vehicle
                console.log('📋 Step 2: Creating diagnosis for vehicle');

                const diagnosisResponse = await createDiagnosis(
                    {
                        fault: data.symptom,
                        notes: data.notes || `Cliente: ${data.clientName}, Teléfono: ${data.clientPhone}, Ubicación: ${data.location || 'No especificada'}`
                    },
                    undefined,
                    { carId }
                );

                if (!diagnosisResponse?.data?._id) {
                    throw new Error('No diagnosis ID returned');
                }

                diagnosisId = diagnosisResponse.data._id;
                console.log('✅ Diagnosis created successfully:', diagnosisId);
                console.log('✅ Questions generated:', diagnosisResponse.data.questions?.length || 0);

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
            }

            // Step 2: Try to create case in carretera backend
            // If carretera backend is available, use it. Otherwise, fallback to localStorage
            try {
                // Check if carretera backend is available
                const isBackendAvailable = await carreteraApi.healthCheck().catch(() => false);

                if (isBackendAvailable) {
                    // Use real backend
                    const response = await carreteraApi.createCase({
                        ...data,
                        diagnosisId // Link to core diagnosis
                    });

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
            const timestamp = Date.now();
            // Use unique ID to avoid duplicates
            const caseId = diagnosisId.startsWith('local-') ? diagnosisId : `case-${diagnosisId}`;
            const caseCount = JSON.parse(localStorage.getItem('carretera_case_count') || '0') + 1;
            const caseNumber = `C-${String(caseCount).padStart(3, '0')}`;

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
                clientLink: `/carretera/c/${caseId}`,
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
                questions: [],
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
