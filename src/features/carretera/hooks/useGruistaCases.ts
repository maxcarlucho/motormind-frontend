import { useState, useEffect, useMemo } from 'react';
import { GruistaCaseDetailed } from '../types/carretera.types';
import { useAuth } from '@/context/Auth.context';

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
 */
export function useGruistaCases(): UseGruistaCasesReturn {
    const [cases, setCases] = useState<GruistaCaseDetailed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'new' | 'in-progress' | 'all'>('all');
    const { user } = useAuth(); // Get current user

    const loadCases = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // For development, load from localStorage or use mock data
            // Pass user information to fetch function
            const gruistaCases = await fetchGruistaCasesFromStorage(user?.name || 'Gruista');
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
 * Fetch gruista cases from localStorage (development)
 * This function now reads from operator cases and automatically assigns them to the gruista
 * In production, this will call the backend API
 */
async function fetchGruistaCasesFromStorage(gruistaName: string): Promise<GruistaCaseDetailed[]> {
    try {
        // First, try to get operator cases (these are the real cases created)
        const operatorCasesStr = localStorage.getItem('carretera_operator_cases');
        const clientCasesStr = localStorage.getItem('carretera_client_cases');

        if (operatorCasesStr) {
            const operatorCases = JSON.parse(operatorCasesStr);
            const clientCases = clientCasesStr ? JSON.parse(clientCasesStr) : {};

            // Transform operator cases to gruista format
            const gruistaCases = operatorCases.map((opCase: any) => {
                // Get client case data if it exists
                const clientCase = clientCases[opCase.id] || {};

                // Map status: pending -> new (for gruista view)
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
                    assignedTo: gruistaName, // Assign to current user
                    questions: clientCase.questions || [
                        '¿Qué problema presenta el vehículo?',
                        '¿Desde cuándo ocurre?',
                        '¿Ha intentado alguna solución?'
                    ],
                    answers: clientCase.answers || [],
                    aiAssessment: clientCase.aiAssessment || {
                        diagnosis: 'Pendiente de evaluación del cliente',
                        confidence: 0,
                        recommendation: 'tow', // Default to tow for safety
                        reasoning: ['Caso en espera de respuestas del cliente'],
                    },
                    createdAt: new Date(opCase.createdAt),
                    updatedAt: new Date(opCase.updatedAt),
                };
            });

            // Sort by creation date (newest first)
            gruistaCases.sort((a: any, b: any) => b.createdAt - a.createdAt);

            return gruistaCases;
        }

        // If no operator cases exist, check for legacy gruista_cases
        const stored = localStorage.getItem('gruista_cases');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map((c: any) => ({
                ...c,
                assignedTo: gruistaName, // Update assigned name
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
            }));
        }
    } catch (err) {
        console.error('Error fetching gruista cases:', err);
    }

    // Return empty array instead of mock data - cleaner for production
    // If you want to see mock data for testing, uncomment the next line:
    // return getMockGruistaCases();
    return [];
}

// Mock data function removed - now we use real operator cases
// If you need to restore mock data for testing, uncomment the function below:
/*
function getMockGruistaCases(): GruistaCaseDetailed[] {
    return [
        // ... mock cases here ...
    ];
}
*/

// Note: We no longer need to save gruista cases separately
// Cases are automatically read from operator cases and transformed on the fly
