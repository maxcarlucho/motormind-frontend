import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import {
    WorkshopCaseDetailed,
    WorkshopRejectionReason,
} from '../types/carretera.types';
import carreteraApi from '../services/carreteraApi.service';
import { useApi } from '@/hooks/useApi';
import { Diagnosis } from '@/types/Diagnosis';

interface UseWorkshopCaseReturn {
    caseData: WorkshopCaseDetailed | null;
    isLoading: boolean;
    error: string | null;
    acceptCase: () => Promise<string>; // Returns service order number
    rejectCase: (reason: WorkshopRejectionReason, notes?: string) => Promise<void>;
    submitOBDDiagnosis: (obdCodes: string[], comments: string) => Promise<void>;
    isProcessing: boolean;
}

/**
 * Hook to manage workshop case reception and updates
 * 
 * @param caseId - Workshop case ID
 * @returns Case data, loading states, and action handlers
 */
export function useWorkshopCase(caseId?: string): UseWorkshopCaseReturn {
    const [caseData, setCaseData] = useState<WorkshopCaseDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // API hooks for core diagnosis system
    const { execute: generatePreliminary } = useApi<Diagnosis>('post', '/cars/:carId/diagnosis/:diagnosisId/preliminary');
    const { execute: getDiagnosis } = useApi<Diagnosis>('get', '/cars/diagnosis/:diagnosisId');

    useEffect(() => {
        if (!caseId) {
            setIsLoading(false);
            return;
        }

        loadCase();
    }, [caseId]);

    const loadCase = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // First try to load from workshop_cases (created when gruista tows)
            const workshopCasesStr = localStorage.getItem('carretera_workshop_cases');
            if (workshopCasesStr) {
                const workshopCases = JSON.parse(workshopCasesStr);
                const found = workshopCases.find((c: any) => c.id === caseId);
                if (found) {
                    // Convert date strings back to Date objects
                    const workshopCase: WorkshopCaseDetailed = {
                        ...found,
                        createdAt: new Date(found.createdAt),
                        updatedAt: new Date(found.updatedAt),
                        gruistaDecision: {
                            ...found.gruistaDecision,
                            decidedAt: new Date(found.gruistaDecision.decidedAt),
                        },
                        acceptedAt: found.acceptedAt ? new Date(found.acceptedAt) : undefined,
                    };
                    setCaseData(workshopCase);
                    return;
                }
            }

            // If not in workshop_cases, try to build from operator/client cases
            // This handles cases that might not have been properly transferred
            const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
            const clientCasesStr = localStorage.getItem('carretera_client_cases');

            if (operatorCasesStr) {
                const operatorCases = JSON.parse(operatorCasesStr);
                const clientCases = clientCasesStr ? JSON.parse(clientCasesStr) : {};

                const opCase = operatorCases.find((c: any) => c.id === caseId);

                if (opCase && caseId) {
                    const clientCase = clientCases[caseId] || {};

                    // Build workshop case from available data
                    const workshopCase: WorkshopCaseDetailed = {
                        id: opCase.id,
                        caseNumber: opCase.caseNumber,
                        vehiclePlate: opCase.vehiclePlate,
                        clientName: opCase.clientName,
                        clientPhone: opCase.clientPhone,
                        symptom: opCase.symptom,
                        location: opCase.location || 'No especificada',
                        questions: clientCase.questions || [],
                        answers: clientCase.answers || [],
                        aiAssessment: clientCase.aiAssessment || {
                            diagnosis: opCase.symptom,
                            confidence: 50,
                            recommendation: 'tow',
                            reasoning: ['Caso transferido al taller'],
                        },
                        gruistaDecision: {
                            decision: 'tow',
                            notes: 'Transferido al taller',
                            decidedAt: new Date(),
                            gruistaName: 'Gruista',
                        },
                        status: 'incoming',
                        createdAt: new Date(opCase.createdAt),
                        updatedAt: new Date(opCase.updatedAt),
                    };

                    // Try to enhance with backend data if available
                    const diagnosisId = clientCase.diagnosisId;
                    const token = localStorage.getItem('token');

                    if (diagnosisId && token) {
                        try {
                            const diagnosisResponse = await getDiagnosis(undefined, undefined, {
                                diagnosisId
                            });
                            const diagnosis = diagnosisResponse.data;

                            if (diagnosis.preliminary?.possibleReasons?.length > 0) {
                                const topReason = diagnosis.preliminary.possibleReasons[0];
                                workshopCase.aiAssessment = {
                                    diagnosis: topReason.title || diagnosis.fault,
                                    confidence: topReason.probability === 'Alta' ? 85 :
                                                topReason.probability === 'Media' ? 65 : 45,
                                    recommendation: 'tow',
                                    reasoning: diagnosis.preliminary.possibleReasons.map((r: any) => r.reasonDetails),
                                };
                            }
                        } catch (apiError) {
                            console.log('Could not fetch backend diagnosis');
                        }
                    }

                    // Save to workshop_cases for future access
                    const existingWorkshopCases = workshopCasesStr ? JSON.parse(workshopCasesStr) : [];
                    existingWorkshopCases.unshift(workshopCase);
                    localStorage.setItem('carretera_workshop_cases', JSON.stringify(existingWorkshopCases));

                    setCaseData(workshopCase);
                    return;
                }
            }

            // Fallback to mock data only if nothing found
            const mockData = getMockWorkshopCase(caseId!);
            if (mockData) {
                setCaseData(mockData);
            } else {
                setError('Caso no encontrado');
            }
        } catch (err) {
            console.error('Error loading workshop case:', err);
            setError('Error al cargar el caso');
        } finally {
            setIsLoading(false);
        }
    };

    const acceptCase = async (): Promise<string> => {
        setIsProcessing(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            // const response = await damageAssessmentApi.post(`/carretera/workshop/${caseId}/accept`);
            // const serviceOrderNumber = response.data.serviceOrderNumber;

            // Mock: Generate service order number
            const serviceOrderNumber = `SO-${Date.now().toString().slice(-6)}`;

            // Update local state
            if (caseData) {
                const updatedCase: WorkshopCaseDetailed = {
                    ...caseData,
                    status: 'accepted',
                    acceptedAt: new Date(),
                    serviceOrderNumber,
                    repairStatus: 'pending-inspection',
                };
                setCaseData(updatedCase);

                // Update localStorage for development
                const storedCases = localStorage.getItem('carretera_workshop_cases');
                if (storedCases) {
                    const cases: WorkshopCaseDetailed[] = JSON.parse(storedCases);
                    const updatedCases = cases.map((c) => (c.id === caseId ? updatedCase : c));
                    localStorage.setItem('carretera_workshop_cases', JSON.stringify(updatedCases));
                }
            }

            enqueueSnackbar(`✅ Caso aceptado - Orden: ${serviceOrderNumber}`, {
                variant: 'success',
                autoHideDuration: 5000,
            });

            return serviceOrderNumber;
        } catch (err) {
            console.error('Error accepting case:', err);
            const errorMessage = 'Error al aceptar el caso';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const rejectCase = async (
        reason: WorkshopRejectionReason,
        _notes?: string
    ): Promise<void> => {
        setIsProcessing(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            // await damageAssessmentApi.post(`/carretera/workshop/${caseId}/reject`, {
            //   reason,
            //   notes,
            // });

            // Update local state
            if (caseData) {
                const updatedCase: WorkshopCaseDetailed = {
                    ...caseData,
                    status: 'rejected',
                };
                setCaseData(updatedCase);

                // Update localStorage for development
                const storedCases = localStorage.getItem('carretera_workshop_cases');
                if (storedCases) {
                    const cases: WorkshopCaseDetailed[] = JSON.parse(storedCases);
                    const updatedCases = cases.map((c) => (c.id === caseId ? updatedCase : c));
                    localStorage.setItem('carretera_workshop_cases', JSON.stringify(updatedCases));
                }
            }

            const reasonLabels: Record<WorkshopRejectionReason, string> = {
                'no-capacity': 'Sin capacidad',
                'no-parts': 'Sin repuestos',
                'wrong-specialty': 'Especialidad incorrecta',
                other: 'Otra razón',
            };

            enqueueSnackbar(`❌ Caso rechazado: ${reasonLabels[reason]}`, {
                variant: 'warning',
                autoHideDuration: 4000,
            });
        } catch (err) {
            console.error('Error rejecting case:', err);
            const errorMessage = 'Error al rechazar el caso';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };


    const submitOBDDiagnosis = async (obdCodes: string[], comments: string): Promise<void> => {
        setIsProcessing(true);
        setError(null);

        try {
            if (!caseId || !caseData) {
                throw new Error('No case data available');
            }

            // Try to get diagnosis ID from localStorage (was saved when case was created)
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            const clientCase = clientCases[caseId];
            const diagnosisId = clientCase?.diagnosisId;

            let diagnosisGenerated = false;
            let generatedFailures = null;

            // Generate mock diagnosis for known OBD codes when no API is available
            const mockDiagnosis = generateMockDiagnosis(obdCodes, caseData?.symptom || '');

            // If we have a diagnosis ID, try to regenerate diagnosis with OBD using core API
            // Only if authenticated (workshop dashboard) - not for workshop reception
            const token = localStorage.getItem('token');
            if (diagnosisId && token) {
                try {
                    // First, get the diagnosis to get carId
                    const diagnosisResponse = await getDiagnosis(undefined, undefined, {
                        diagnosisId
                    });
                    const diagnosis = diagnosisResponse.data;
                    const carId = diagnosis.car?._id;

                    if (carId) {
                        // Now regenerate the diagnosis with OBD codes
                        const preliminaryResponse = await generatePreliminary(
                            {
                                obdCodes, // Now WITH OBD codes for full diagnosis
                            },
                            undefined,
                            { carId, diagnosisId }
                        );

                        console.log('Full diagnosis generated with OBD:', preliminaryResponse.data);
                        diagnosisGenerated = true;
                        generatedFailures = preliminaryResponse.data.processedFault || null;

                        enqueueSnackbar('✅ Diagnóstico completo generado con códigos OBD', {
                            variant: 'success',
                            autoHideDuration: 5000
                        });
                    }
                } catch (apiError) {
                    console.log('Could not generate diagnosis with core API, using mock data');
                    // Use mock diagnosis if API fails
                    if (mockDiagnosis) {
                        diagnosisGenerated = true;
                        generatedFailures = mockDiagnosis;
                    }
                }
            } else if (mockDiagnosis) {
                // No API available, use mock diagnosis
                diagnosisGenerated = true;
                generatedFailures = mockDiagnosis;
            }

            // Also try carretera backend if available and authenticated
            const authToken = localStorage.getItem('token');
            if (authToken) {
                try {
                    const isBackendAvailable = await carreteraApi.healthCheck().catch(() => false);
                    if (isBackendAvailable) {
                        const result = await carreteraApi.submitOBDDiagnosis(caseId, obdCodes, comments);
                        console.log('Carretera backend response:', result);
                    }
                } catch (carreteraError) {
                    console.log('Carretera backend not available');
                }
            }

            // Always save to localStorage as fallback
            const obdDiagnosisData = {
                obdCodes,
                technicianComments: comments,
                timestamp: new Date().toISOString(),
                diagnosisGenerated,
                failures: generatedFailures,
            };

            const storedCases = localStorage.getItem('carretera_workshop_cases');
            if (storedCases) {
                const cases: WorkshopCaseDetailed[] = JSON.parse(storedCases);
                const index = cases.findIndex(c => c.id === caseId);
                if (index !== -1) {
                    (cases[index] as any).obdDiagnosis = obdDiagnosisData;
                    cases[index].repairStatus = 'inspecting';
                    localStorage.setItem('carretera_workshop_cases', JSON.stringify(cases));
                }
            }

            // Update local state to reflect diagnosis submitted
            if (caseData) {
                const updatedCase: WorkshopCaseDetailed = {
                    ...caseData,
                    repairStatus: 'inspecting',
                    obdDiagnosis: obdDiagnosisData as any,
                };
                setCaseData(updatedCase);
            }

            if (!diagnosisGenerated) {
                enqueueSnackbar('✅ Diagnóstico OBD guardado (sin conexión al servidor)', {
                    variant: 'success',
                    autoHideDuration: 4000,
                });
            }
        } catch (err) {
            console.error('Error submitting OBD diagnosis:', err);
            const errorMessage = 'Error al enviar el diagnóstico OBD';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        caseData,
        isLoading,
        error,
        acceptCase,
        rejectCase,
        submitOBDDiagnosis,
        isProcessing,
    };
}

/**
 * Get mock workshop case for development
 */
function getMockWorkshopCase(caseId: string): WorkshopCaseDetailed | null {
    // Try to load from localStorage first
    const storedCases = localStorage.getItem('carretera_workshop_cases');
    if (storedCases) {
        const cases: WorkshopCaseDetailed[] = JSON.parse(storedCases);
        const found = cases.find((c) => c.id === caseId);
        if (found) {
            // Convert date strings back to Date objects
            return {
                ...found,
                createdAt: new Date(found.createdAt),
                updatedAt: new Date(found.updatedAt),
                gruistaDecision: {
                    ...found.gruistaDecision,
                    decidedAt: new Date(found.gruistaDecision.decidedAt),
                },
                acceptedAt: found.acceptedAt ? new Date(found.acceptedAt) : undefined,
            };
        }
    }

    // Initialize with mock data if not found
    const mockCases: WorkshopCaseDetailed[] = [
        {
            id: 'workshop-case-001',
            caseNumber: 'C-001',
            vehiclePlate: 'ABC1234',
            clientName: 'Juan Pérez',
            clientPhone: '+34600123456',
            symptom: 'Motor no arranca, hace click al girar la llave',
            location: 'A-1 km 25 dirección Madrid',
            questions: [
                '¿El motor hace algún ruido al intentar arrancar?',
                '¿Las luces del tablero encienden normalmente?',
                '¿Cuándo fue la última vez que cambió la batería?',
            ],
            answers: [
                'Sí, hace un click repetitivo',
                'Sí, todas las luces funcionan normalmente',
                'Hace aproximadamente 3 años',
            ],
            aiAssessment: {
                diagnosis: 'Posible fallo en motor de arranque o batería descargada',
                confidence: 75,
                recommendation: 'tow',
                reasoning: [
                    'Click característico indica posible fallo del motor de arranque',
                    'Luces funcionando sugiere batería con algo de carga',
                    'Batería antigua puede tener carga insuficiente para arrancar',
                    'Requiere diagnóstico profesional con equipo especializado',
                ],
            },
            gruistaDecision: {
                decision: 'tow',
                notes:
                    'Motor de arranque no responde. Cliente reporta que el problema comenzó de repente esta mañana. Vehículo no puede moverse por sus propios medios.',
                decidedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
                gruistaName: 'Paco García',
            },
            status: 'incoming',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            updatedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        },
    ];

    // Store in localStorage
    localStorage.setItem('carretera_workshop_cases', JSON.stringify(mockCases));

    return mockCases.find((c) => c.id === caseId) || null;
}

/**
 * Generate mock diagnosis based on OBD codes
 * This simulates AI diagnosis when API is not available
 */
function generateMockDiagnosis(obdCodes: string[], symptom: string) {
    // P2425 - Exhaust Gas Recirculation (EGR) Cooling Valve Control Circuit
    if (obdCodes.includes('P2425')) {
        return [
            {
                part: 'Válvula de refrigeración EGR',
                description: 'La válvula de control del circuito de refrigeración del EGR presenta un mal funcionamiento. Esto puede causar problemas de arranque en frío y pérdida de potencia.',
                probability: 85,
                steps: [
                    'Verificar conexiones eléctricas de la válvula EGR',
                    'Comprobar el funcionamiento del actuador de la válvula con escáner',
                    'Inspeccionar el sistema de refrigeración del EGR por obstrucciones',
                    'Si es necesario, reemplazar la válvula de refrigeración EGR',
                    'Borrar códigos y realizar prueba de conducción'
                ],
                estimatedTime: '1.5 - 2 horas'
            },
            {
                part: 'Cableado del circuito de control',
                description: 'Posible cortocircuito o circuito abierto en el cableado de control de la válvula EGR.',
                probability: 60,
                steps: [
                    'Inspeccionar visualmente el arnés de cables',
                    'Medir continuidad en el circuito de control',
                    'Verificar voltaje de referencia del ECM',
                    'Reparar o reemplazar cableado dañado si se encuentra'
                ],
                estimatedTime: '45 - 60 minutos'
            },
            {
                part: 'Módulo de Control del Motor (ECM)',
                description: 'Fallo en el módulo de control que gestiona la válvula EGR. Menos probable pero posible.',
                probability: 25,
                steps: [
                    'Verificar actualizaciones de software del ECM',
                    'Realizar diagnóstico completo del ECM',
                    'Comprobar otros códigos relacionados',
                    'Reprogramar o reemplazar ECM si es necesario'
                ],
                estimatedTime: '2 - 3 horas'
            }
        ];
    }

    // P0171 - Sistema demasiado pobre (Banco 1)
    if (obdCodes.includes('P0171')) {
        return [
            {
                part: 'Fugas de aire en admisión',
                description: 'Entrada de aire no medido después del sensor MAF causando mezcla pobre.',
                probability: 75,
                steps: [
                    'Inspeccionar mangueras de vacío por grietas o desconexiones',
                    'Verificar juntas del colector de admisión',
                    'Comprobar el estado del filtro de aire',
                    'Usar detector de fugas o spray para localizar entradas de aire'
                ],
                estimatedTime: '30 - 45 minutos'
            },
            {
                part: 'Sensor MAF defectuoso',
                description: 'El sensor de flujo de masa de aire puede estar sucio o dañado.',
                probability: 60,
                steps: [
                    'Limpiar el sensor MAF con limpiador específico',
                    'Verificar valores del sensor con escáner',
                    'Comparar con especificaciones del fabricante',
                    'Reemplazar si está fuera de rango'
                ],
                estimatedTime: '20 - 30 minutos'
            }
        ];
    }

    // Default diagnosis for unknown codes
    return [
        {
            part: 'Diagnóstico pendiente',
            description: `Código OBD ${obdCodes.join(', ')} detectado. Se requiere diagnóstico detallado basado en el síntoma: ${symptom}`,
            probability: 50,
            steps: [
                'Verificar el significado específico del código en manual del fabricante',
                'Realizar inspección visual del sistema afectado',
                'Comprobar componentes relacionados con multímetro',
                'Seguir árbol de diagnóstico del fabricante'
            ],
            estimatedTime: 'Por determinar'
        }
    ];
}
