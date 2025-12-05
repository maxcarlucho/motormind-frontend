import { useState, useEffect, useMemo } from 'react';
import { GruistaCaseDetailed } from '../types/carretera.types';
import { useAuth } from '@/context/Auth.context';
import { useApi } from '@/hooks/useApi';

interface UseGruistaCasesReturn {
    cases: GruistaCaseDetailed[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    filterByStatus: (status: 'new' | 'in-progress' | 'all') => void;
    filteredCases: GruistaCaseDetailed[];
}

/**
 * Hook to fetch and manage gruista's assigned cases
 * Now fetches from backend API (diagnoses) instead of localStorage
 */
export function useGruistaCases(): UseGruistaCasesReturn {
    const [cases, setCases] = useState<GruistaCaseDetailed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'new' | 'in-progress' | 'all'>('all');
    const { user } = useAuth();

    // API to fetch diagnoses from the backend (same endpoint as Diagnoses page)
    const { execute: fetchDiagnoses } = useApi<{ data: any[]; total: number }>('get', '/diagnoses');

    const loadCases = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Try to fetch from backend API first
            const gruistaCases = await fetchGruistaCasesFromBackend(fetchDiagnoses, user?.name || 'Gruista');
            setCases(gruistaCases);
        } catch (err) {
            console.error('Error loading gruista cases:', err);
            setError('Error al cargar los casos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCases();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Reload when user changes

    const refresh = async () => {
        await loadCases();
    };

    const filterByStatus = (status: 'new' | 'in-progress' | 'all') => {
        setStatusFilter(status);
    };

    // Apply status filter
    const filteredCases = useMemo(() => {
        if (statusFilter === 'all') {
            return cases;
        }
        return cases.filter((c) => c.status === statusFilter);
    }, [cases, statusFilter]);

    return {
        cases,
        isLoading,
        error,
        refresh,
        filterByStatus,
        filteredCases,
    };
}

/**
 * Fetch gruista cases from backend API
 * Fetches diagnoses and transforms them to gruista case format
 * Only shows diagnoses that have the roadside assistance context (carretera)
 */
async function fetchGruistaCasesFromBackend(
    fetchDiagnoses: (data?: any, params?: any) => Promise<any>,
    gruistaName: string
): Promise<GruistaCaseDetailed[]> {
    try {
        // Fetch all diagnoses from backend (same endpoint as Diagnoses page)
        const response = await fetchDiagnoses(undefined, { limit: '100' });

        if (!response?.data?.data) {
            console.log('No diagnoses found in backend');
            return [];
        }

        const diagnoses = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        console.log(`📋 Found ${diagnoses.length} total diagnoses in backend`);

        // Filter only roadside assistance cases (contain [ASISTENCIA CARRETERA] in fault)
        // and transform to gruista format
        const gruistaCases: GruistaCaseDetailed[] = diagnoses
            .filter((diagnosis: any) => {
                // Check if it's a roadside assistance case
                const fault = diagnosis.fault || '';
                return fault.includes('ASISTENCIA CARRETERA') || fault.includes('CARRETERA');
            })
            .map((diagnosis: any) => {
                // Extract info from diagnosis
                const car = diagnosis.car || {};
                const fault = diagnosis.fault || '';

                // Clean up the symptom - remove the internal roadside context tag
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
                    // Not JSON, try regex fallback for old format
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
                const caseNumber = carreteraData?.caseNumber
                    || `C-${diagnosis._id.slice(-4).toUpperCase()}`;

                // Determine status: prioritize carreteraData.status, then diagnosis state
                let status: 'new' | 'in-progress' | 'completed' = 'new';
                if (carreteraData?.status) {
                    // Map carretera status to gruista status
                    status = carreteraData.status === 'pending' ? 'new' :
                             carreteraData.status === 'assigned' ? 'in-progress' :
                             carreteraData.status === 'completed' ? 'completed' :
                             carreteraData.status === 'towing' ? 'in-progress' :
                             'new';
                } else if (diagnosis.preliminary) {
                    status = 'in-progress';
                }
                if (diagnosis.failures && diagnosis.failures.length > 0) {
                    status = 'completed';
                }

                // Build AI assessment from preliminary if available
                const aiAssessment = diagnosis.preliminary ? {
                    diagnosis: diagnosis.preliminary.diagnosis || 'Evaluación completada',
                    confidence: diagnosis.preliminary.confidence || 70,
                    recommendation: diagnosis.preliminary.recommendation || 'tow',
                    reasoning: diagnosis.preliminary.reasoning || ['Evaluación preliminar completada'],
                } : {
                    diagnosis: 'Pendiente de evaluación del cliente',
                    confidence: 0,
                    recommendation: 'tow' as const,
                    reasoning: ['Caso en espera de respuestas del cliente'],
                };

                return {
                    id: diagnosis._id,
                    caseNumber,
                    vehiclePlate: car.plate || 'Sin matrícula',
                    clientName,
                    clientPhone,
                    symptom: cleanSymptom || 'Sin síntoma registrado',
                    location,
                    status,
                    assignedTo: gruistaName,
                    questions: diagnosis.questions || [],
                    answers: diagnosis.answers ? diagnosis.answers.split('\n').filter((a: string) => a.trim()) : [],
                    aiAssessment,
                    createdAt: new Date(diagnosis.createdAt || Date.now()),
                    updatedAt: new Date(diagnosis.updatedAt || Date.now()),
                };
            });

        // Sort by creation date (newest first)
        gruistaCases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`✅ Loaded ${gruistaCases.length} roadside cases from backend`);
        return gruistaCases;

    } catch (err) {
        console.error('Error fetching from backend:', err);
        // Fallback to localStorage if backend fails
        return fetchGruistaCasesFromLocalStorage(gruistaName);
    }
}

/**
 * Fallback: Fetch from localStorage if backend is unavailable
 */
function fetchGruistaCasesFromLocalStorage(gruistaName: string): GruistaCaseDetailed[] {
    try {
        const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
        const clientCasesStr = localStorage.getItem('carretera_client_cases');

        if (operatorCasesStr) {
            const operatorCases = JSON.parse(operatorCasesStr);
            const clientCases = clientCasesStr ? JSON.parse(clientCasesStr) : {};

            const gruistaCases = operatorCases.map((opCase: any) => {
                const clientCase = clientCases[opCase.id] || {};
                const gruistaStatus = opCase.status === 'pending' ? 'new' :
                                     opCase.status === 'assigned' ? 'in-progress' :
                                     opCase.status;

                return {
                    id: opCase.id,
                    caseNumber: opCase.caseNumber,
                    vehiclePlate: opCase.vehiclePlate,
                    clientName: opCase.clientName,
                    clientPhone: opCase.clientPhone,
                    symptom: opCase.symptom,
                    location: opCase.location || 'No especificada',
                    status: gruistaStatus,
                    assignedTo: gruistaName,
                    questions: clientCase.questions || [],
                    answers: clientCase.answers || [],
                    aiAssessment: clientCase.aiAssessment || {
                        diagnosis: 'Pendiente de evaluación',
                        confidence: 0,
                        recommendation: 'tow',
                        reasoning: ['En espera'],
                    },
                    createdAt: new Date(opCase.createdAt),
                    updatedAt: new Date(opCase.updatedAt),
                };
            });

            gruistaCases.sort((a: any, b: any) => b.createdAt - a.createdAt);
            console.log(`📦 Loaded ${gruistaCases.length} cases from localStorage (fallback)`);
            return gruistaCases;
        }
    } catch (err) {
        console.error('Error fetching from localStorage:', err);
    }
    return [];
}
