import { useState, useEffect, useMemo } from 'react';
import { GruistaCaseDetailed } from '../types/carretera.types';

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

    const loadCases = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // For development, load from localStorage or use mock data
            const mockCases = await fetchGruistaCasesFromStorage();
            setCases(mockCases);
        } catch (err) {
            console.error('Error loading gruista cases:', err);
            setError('Error al cargar los casos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCases();
    }, []);

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
 * In production, this will call the backend API
 */
async function fetchGruistaCasesFromStorage(): Promise<GruistaCaseDetailed[]> {
    try {
        const stored = localStorage.getItem('gruista_cases');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
            }));
        }
    } catch (err) {
        console.error('Error fetching gruista cases:', err);
    }

    // Return mock data if no stored cases
    return getMockGruistaCases();
}

/**
 * Mock data for development
 */
function getMockGruistaCases(): GruistaCaseDetailed[] {
    return [
        {
            id: 'gruista-case-001',
            caseNumber: 'C-001',
            vehiclePlate: 'ABC1234',
            clientName: 'Juan Pérez',
            clientPhone: '+34600123456',
            symptom: 'Motor no arranca, hace click',
            location: 'A-1 km 25 dirección Madrid',
            status: 'new',
            assignedTo: 'Paco García',
            questions: [
                '¿El motor hace algún ruido al intentar arrancar?',
                '¿Las luces del tablero encienden?',
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
                    'Click característico indica motor de arranque',
                    'Luces funcionan sugiere batería con carga',
                    'Requiere diagnóstico profesional con equipo',
                ],
            },
            createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
            updatedAt: new Date(),
        },
        {
            id: 'gruista-case-002',
            caseNumber: 'C-002',
            vehiclePlate: 'XYZ5678',
            clientName: 'María García',
            clientPhone: '+34611222333',
            symptom: 'Rueda pinchada, no tiene rueda de repuesto',
            location: 'M-30 salida 12',
            status: 'in-progress',
            assignedTo: 'Paco García',
            questions: [
                '¿Tiene rueda de repuesto?',
                '¿El vehículo está en lugar seguro?',
                '¿Puede cambiar la rueda usted mismo?',
            ],
            answers: [
                'No, solo tiene kit antipinchazos',
                'Sí, en el arcén',
                'No, nunca lo he hecho',
            ],
            aiAssessment: {
                diagnosis: 'Pinchazo sin rueda de repuesto disponible',
                confidence: 95,
                recommendation: 'tow',
                reasoning: [
                    'No dispone de rueda de repuesto',
                    'Kit antipinchazos no es solución permanente',
                    'Requiere traslado a taller para reparación',
                ],
            },
            createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
            updatedAt: new Date(),
        },
        {
            id: 'gruista-case-003',
            caseNumber: 'C-003',
            vehiclePlate: 'DEF9012',
            clientName: 'Pedro López',
            clientPhone: '+34622333444',
            symptom: 'Batería descargada',
            location: 'Parking Centro Comercial La Vaguada',
            status: 'new',
            assignedTo: 'Paco García',
            questions: [
                '¿Se quedó sin batería de repente?',
                '¿Dejó las luces encendidas?',
                '¿Qué edad tiene la batería?',
            ],
            answers: [
                'Sí, de repente no arrancó',
                'No, todo estaba apagado',
                'Unos 5 años aproximadamente',
            ],
            aiAssessment: {
                diagnosis: 'Batería agotada por antigüedad',
                confidence: 85,
                recommendation: 'repair',
                reasoning: [
                    'Batería con más de 4 años de antigüedad',
                    'No hay indicios de luces olvidadas',
                    'Posible arranque con pinzas',
                ],
            },
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
            updatedAt: new Date(),
        },
    ];
}

/**
 * Helper to save gruista cases to localStorage (for development)
 */
export function saveGruistaCasesToStorage(cases: GruistaCaseDetailed[]) {
    try {
        localStorage.setItem('gruista_cases', JSON.stringify(cases));
    } catch (err) {
        console.error('Error saving gruista cases:', err);
    }
}
