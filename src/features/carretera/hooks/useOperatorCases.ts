import { useState, useEffect, useMemo } from 'react';
import { OperatorCase, CaseFilters, AssessmentStatus } from '../types/carretera.types';
import { cleanDuplicateCases } from '../utils/cleanDuplicateCases';
import { useApi } from '@/hooks/useApi';
import '../utils/clearAllData'; // Auto-imports the duplicate checker

interface UseOperatorCasesReturn {
    cases: OperatorCase[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    filterByStatus: (status: AssessmentStatus | 'all') => void;
    searchCases: (query: string) => void;
    filteredCases: OperatorCase[];
    deleteCase: (caseId: string) => Promise<void>;
    deleteAllCases: () => Promise<void>;
}

/**
 * Hook to fetch and manage operator's cases with filtering and search
 * Now loads from backend (MongoDB) instead of just localStorage
 */
export function useOperatorCases(): UseOperatorCasesReturn {
    const [cases, setCases] = useState<OperatorCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<CaseFilters>({
        status: 'all',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    // API to fetch diagnoses from backend
    const { execute: fetchDiagnoses } = useApi<{ data: any[]; total: number }>('get', '/diagnoses');

    const loadCases = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch from backend first, fallback to localStorage
            const operatorCases: OperatorCase[] = await fetchCasesFromBackendApi(fetchDiagnoses);

            setCases(operatorCases);
        } catch (err) {
            console.error('Error loading cases:', err);
            setError('Error al cargar los casos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Clean duplicates first
        cleanDuplicateCases();
        // Then load cases
        loadCases();
    }, []);

    const refresh = async () => {
        await loadCases();
    };

    /**
     * Elimina un caso de todos los storages (operador, cliente, taller)
     */
    const deleteCase = async (caseId: string) => {
        try {
            // 1. Eliminar de operator_cases
            const operatorCases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
            const updatedOperatorCases = operatorCases.filter((c: OperatorCase) => c.id !== caseId);
            localStorage.setItem('carretera_operator_cases', JSON.stringify(updatedOperatorCases));

            // 2. Eliminar de client_cases
            const clientCases = JSON.parse(localStorage.getItem('carretera_client_cases') || '{}');
            if (clientCases[caseId]) {
                delete clientCases[caseId];
                localStorage.setItem('carretera_client_cases', JSON.stringify(clientCases));
            }

            // 3. Eliminar de workshop_cases
            const workshopCases = JSON.parse(localStorage.getItem('carretera_workshop_cases') || '[]');
            const updatedWorkshopCases = workshopCases.filter((c: any) => c.id !== caseId);
            localStorage.setItem('carretera_workshop_cases', JSON.stringify(updatedWorkshopCases));

            // 4. Actualizar estado local
            setCases(prev => prev.filter(c => c.id !== caseId));

            console.log(`✅ Caso ${caseId} eliminado de todos los storages`);
        } catch (err) {
            console.error('Error deleting case:', err);
            throw new Error('Error al eliminar el caso');
        }
    };

    /**
     * Elimina TODOS los casos (operador, cliente, taller)
     */
    const deleteAllCases = async () => {
        try {
            localStorage.removeItem('carretera_operator_cases');
            localStorage.removeItem('carretera_client_cases');
            localStorage.removeItem('carretera_workshop_cases');
            localStorage.removeItem('carretera_case_count');

            setCases([]);

            console.log('🧹 Todos los casos han sido eliminados');
        } catch (err) {
            console.error('Error deleting all cases:', err);
            throw new Error('Error al eliminar todos los casos');
        }
    };

    const filterByStatus = (status: AssessmentStatus | 'all') => {
        setFilters((prev) => ({ ...prev, status }));
    };

    const searchCases = (query: string) => {
        setFilters((prev) => ({ ...prev, search: query }));
    };

    // Apply filters and search
    const filteredCases = useMemo(() => {
        let filtered = [...cases];

        // Filter by status
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter((c) => c.status === filters.status);
        }

        // Search by plate or client name
        if (filters.search) {
            const query = filters.search.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.vehiclePlate.toLowerCase().includes(query) ||
                    c.clientName.toLowerCase().includes(query)
            );
        }

        // Sort
        if (filters.sortBy === 'createdAt') {
            filtered.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        } else if (filters.sortBy === 'status') {
            filtered.sort((a, b) => {
                return filters.sortOrder === 'asc'
                    ? a.status.localeCompare(b.status)
                    : b.status.localeCompare(a.status);
            });
        } else if (filters.sortBy === 'plate') {
            filtered.sort((a, b) => {
                return filters.sortOrder === 'asc'
                    ? a.vehiclePlate.localeCompare(b.vehiclePlate)
                    : b.vehiclePlate.localeCompare(a.vehiclePlate);
            });
        }

        return filtered;
    }, [cases, filters]);

    return {
        cases,
        isLoading,
        error,
        refresh,
        filterByStatus,
        searchCases,
        filteredCases,
        deleteCase,
        deleteAllCases,
    };
}

/**
 * Fetch cases from backend API (MongoDB)
 * Filters diagnoses that have [ASISTENCIA CARRETERA] in fault
 */
async function fetchCasesFromBackendApi(
    fetchDiagnoses: (data?: any, params?: any) => Promise<any>
): Promise<OperatorCase[]> {
    try {
        // Fetch all diagnoses from backend
        const response = await fetchDiagnoses(undefined, { limit: '100' });

        if (!response?.data?.data) {
            console.log('No diagnoses found in backend, falling back to localStorage');
            return fetchCasesFromLocalStorage();
        }

        const diagnoses = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        console.log(`📋 Operator: Found ${diagnoses.length} total diagnoses in backend`);

        // Filter only roadside assistance cases
        const operatorCases: OperatorCase[] = diagnoses
            .filter((diagnosis: any) => {
                const fault = diagnosis.fault || '';
                return fault.includes('ASISTENCIA CARRETERA') || fault.includes('CARRETERA');
            })
            .map((diagnosis: any) => {
                const car = diagnosis.car || {};
                const fault = diagnosis.fault || '';
                const cleanSymptom = fault.replace(/\[ASISTENCIA CARRETERA[^\]]*\]/g, '').trim();

                // Parse carretera data from notes (JSON format)
                let carreteraData: any = null;
                try {
                    if (diagnosis.notes && diagnosis.notes.startsWith('{')) {
                        const parsed = JSON.parse(diagnosis.notes);
                        carreteraData = parsed.carretera || null;
                    }
                } catch {
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

                // Determine status from backend diagnosis.status (source of truth)
                // Para carretera: ASSIGN_OBD_CODES o PRELIMINARY = completado (flujo termina con pre-diagnóstico)
                let status: AssessmentStatus = 'pending';
                const backendStatus = diagnosis.status || '';

                // Map backend status to operator status (flujo carretera)
                if (backendStatus === 'REPAIRED' || backendStatus === 'IN_REPARATION' ||
                    backendStatus === 'PRELIMINARY' || backendStatus === 'ASSIGN_OBD_CODES') {
                    // En carretera, cuando llega al taller (OBD/PRELIMINARY) ya está "completado"
                    status = 'completed';
                } else if (backendStatus === 'GUIDED_QUESTIONS') {
                    // Check if client has answered questions
                    const hasAnswers = diagnosis.answers && diagnosis.answers.trim().length > 0;
                    status = hasAnswers ? 'in-progress' : 'pending';
                } else {
                    // Fallback to carreteraData or default
                    if (carreteraData?.status) {
                        status = carreteraData.status as AssessmentStatus;
                    } else if (diagnosis.preliminary) {
                        status = 'completed';
                    }
                }

                return {
                    id: diagnosis._id,
                    caseNumber,
                    vehiclePlate: car.plate || 'Sin matrícula',
                    clientName,
                    clientPhone,
                    symptom: cleanSymptom || 'Sin síntoma registrado',
                    location,
                    status,
                    createdAt: new Date(diagnosis.createdAt || Date.now()),
                    updatedAt: new Date(diagnosis.updatedAt || Date.now()),
                    clientLink: `/carretera/c/${diagnosis._id}`,
                    workshopLink: `/carretera/t/${diagnosis._id}`,
                };
            });

        // Sort by creation date (newest first)
        operatorCases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`✅ Operator: Loaded ${operatorCases.length} roadside cases from backend`);
        return operatorCases;

    } catch (err) {
        console.error('Error fetching from backend:', err);
        return fetchCasesFromLocalStorage();
    }
}

/**
 * Fallback: Fetch from localStorage if backend is unavailable
 */
function fetchCasesFromLocalStorage(): OperatorCase[] {
    try {
        const stored = localStorage.getItem('carretera_operator_cases');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
            }));
        }
    } catch (err) {
        console.error('Error fetching from localStorage:', err);
    }
    return [];
}

/**
 * Helper to add a new case to localStorage (for development)
 * This will be removed when backend is ready
 */
export function addCaseToLocalStorage(caseData: OperatorCase) {
    try {
        const stored = localStorage.getItem('carretera_operator_cases');
        const cases = stored ? JSON.parse(stored) : [];
        cases.unshift(caseData); // Add to beginning
        localStorage.setItem('carretera_operator_cases', JSON.stringify(cases));
    } catch (err) {
        console.error('Error saving case to localStorage:', err);
    }
}
