import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import {
    WorkshopCaseDetailed,
    WorkshopRepairStatus,
    WorkshopRejectionReason,
} from '../types/carretera.types';
import carreteraApi from '../services/carreteraApi.service';

interface UseWorkshopCaseReturn {
    caseData: WorkshopCaseDetailed | null;
    isLoading: boolean;
    error: string | null;
    acceptCase: () => Promise<string>; // Returns service order number
    rejectCase: (reason: WorkshopRejectionReason, notes?: string) => Promise<void>;
    updateRepairStatus: (status: WorkshopRepairStatus) => Promise<void>;
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
            // TODO: Replace with actual API call
            // const response = await damageAssessmentApi.get(`/carretera/workshop/${caseId}`);

            // Mock data for development
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
        notes?: string
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

    const updateRepairStatus = async (status: WorkshopRepairStatus): Promise<void> => {
        setIsProcessing(true);
        setError(null);

        try {
            // For now, use localStorage (API integration ready when backend is available)
            // When backend is ready, uncomment this line:
            // await carreteraApi.updateRepairStatus(caseId!, status);

            // Mock implementation for development
            const storedCases = localStorage.getItem('carretera_workshop_cases');
            if (storedCases) {
                const cases: WorkshopCaseDetailed[] = JSON.parse(storedCases);
                const index = cases.findIndex(c => c.id === caseId);
                if (index !== -1) {
                    cases[index].repairStatus = status;
                    cases[index].status = status === 'completed' ? 'completed' : 'in-repair';
                    localStorage.setItem('carretera_workshop_cases', JSON.stringify(cases));
                }
            }

            // Update local state
            if (caseData) {
                const updatedCase: WorkshopCaseDetailed = {
                    ...caseData,
                    repairStatus: status,
                    status: status === 'completed' ? 'completed' : 'in-repair',
                };
                setCaseData(updatedCase);
            }

            const statusLabels: Record<WorkshopRepairStatus, string> = {
                'pending-inspection': 'Pendiente de inspección',
                inspecting: 'Inspeccionando',
                'waiting-parts': 'Esperando repuestos',
                repairing: 'Reparando',
                testing: 'Probando',
                completed: 'Completado',
            };

            enqueueSnackbar(`🔧 Estado actualizado: ${statusLabels[status]}`, {
                variant: 'info',
            });
        } catch (err) {
            console.error('Error updating repair status:', err);
            const errorMessage = 'Error al actualizar el estado';
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

            // For now, use localStorage (API integration ready when backend is available)
            // When backend is ready, uncomment this line:
            // const result = await carreteraApi.submitOBDDiagnosis(caseId, obdCodes, comments);

            // Mock implementation for development
            const obdDiagnosisData = {
                obdCodes,
                technicianComments: comments,
                timestamp: new Date().toISOString(),
            };

            // Store in localStorage for development
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
                };
                setCaseData(updatedCase);
            }

            enqueueSnackbar('✅ Diagnóstico OBD registrado exitosamente', {
                variant: 'success',
                autoHideDuration: 4000,
            });
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
        updateRepairStatus,
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
