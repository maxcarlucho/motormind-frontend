import { useState, useEffect, useMemo } from 'react';
import { OperatorCase, CaseFilters, AssessmentStatus } from '../types/carretera.types';
import { cleanDuplicateCases } from '../utils/cleanDuplicateCases';
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

    const loadCases = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // For now, we'll fetch all assessments and filter client-side
            // In production, this should be a backend endpoint: GET /api/carretera/cases

            // Using a mock data approach for development
            // TODO: Replace with actual API call when backend is ready
            const mockCases: OperatorCase[] = await fetchCasesFromBackend();

            setCases(mockCases);
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
 * Temporary function to fetch cases from backend
 * This will be replaced with actual API endpoint
 */
async function fetchCasesFromBackend(): Promise<OperatorCase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // For development, we'll use localStorage to persist mock data
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
        console.error('Error fetching cases:', err);
    }

    // Return empty array if no stored cases
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
