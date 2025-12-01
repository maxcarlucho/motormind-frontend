import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { WorkshopCaseDetailed, WorkshopCaseStatus, WorkshopRepairStatus } from '../types/carretera.types';

/**
 * Phase 5: Workshop Dashboard
 * Shows all workshop cases with filters and status tracking
 */
export function WorkshopDashboard() {
    const navigate = useNavigate();
    const [cases, setCases] = useState<WorkshopCaseDetailed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<WorkshopCaseStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            // const response = await damageAssessmentApi.get('/carretera/workshop/cases');
            // setCases(response.data.cases);

            // Load from localStorage for development
            const storedCases = localStorage.getItem('carretera_workshop_cases');
            if (storedCases) {
                const parsedCases: WorkshopCaseDetailed[] = JSON.parse(storedCases);
                // Convert date strings to Date objects
                const cases = parsedCases.map(c => ({
                    ...c,
                    createdAt: new Date(c.createdAt),
                    updatedAt: new Date(c.updatedAt),
                    gruistaDecision: {
                        ...c.gruistaDecision,
                        decidedAt: new Date(c.gruistaDecision.decidedAt),
                    },
                    acceptedAt: c.acceptedAt ? new Date(c.acceptedAt) : undefined,
                }));
                setCases(cases);
            } else {
                // No cases yet - return empty array
                setCases([]);
            }
        } catch (error) {
            console.error('Error loading workshop cases:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCases = cases.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesSearch = !searchTerm ||
            c.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: WorkshopCaseStatus) => {
        switch (status) {
            case 'incoming':
                return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '📥', label: 'ENTRANTE' };
            case 'accepted':
                return { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', label: 'ACEPTADO' };
            case 'rejected':
                return { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', label: 'RECHAZADO' };
            case 'in-repair':
                return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔧', label: 'EN REPARACIÓN' };
            case 'completed':
                return { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🎉', label: 'COMPLETADO' };
        }
    };

    const getRepairStatusIcon = (status?: WorkshopRepairStatus) => {
        if (!status) return null;
        const icons: Record<WorkshopRepairStatus, string> = {
            'pending-inspection': '⏳',
            'inspecting': '🔍',
            'waiting-parts': '📦',
            'repairing': '🔧',
            'testing': '✅',
            'completed': '🎉',
        };
        return icons[status];
    };

    const statusCounts = {
        all: cases.length,
        incoming: cases.filter(c => c.status === 'incoming').length,
        accepted: cases.filter(c => c.status === 'accepted').length,
        'in-repair': cases.filter(c => c.status === 'in-repair').length,
        completed: cases.filter(c => c.status === 'completed').length,
        rejected: cases.filter(c => c.status === 'rejected').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold mb-2">Dashboard Taller</h1>
                    <p className="text-purple-100">Gestión de casos y reparaciones</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${statusFilter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todos ({statusCounts.all})
                    </button>
                    <button
                        onClick={() => setStatusFilter('incoming')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${statusFilter === 'incoming'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📥 Entrantes ({statusCounts.incoming})
                    </button>
                    <button
                        onClick={() => setStatusFilter('accepted')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${statusFilter === 'accepted'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        ✅ Aceptados ({statusCounts.accepted})
                    </button>
                    <button
                        onClick={() => setStatusFilter('in-repair')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${statusFilter === 'in-repair'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        🔧 En Reparación ({statusCounts['in-repair']})
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${statusFilter === 'completed'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        🎉 Completados ({statusCounts.completed})
                    </button>
                    </div>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por matrícula, cliente o caso..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={loadCases}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Cases List */}
            <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-2 text-gray-600">Cargando casos...</p>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-600">No hay casos que mostrar</p>
                    </div>
                ) : (
                    filteredCases.map((caseItem) => {
                        const statusBadge = getStatusBadge(caseItem.status);
                        const repairIcon = getRepairStatusIcon(caseItem.repairStatus);

                        return (
                            <div
                                key={caseItem.id}
                                onClick={() => navigate(`/carretera/t/${caseItem.id}`)}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                            >
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.color}`}>
                                            {statusBadge.icon} {statusBadge.label}
                                        </span>
                                        {caseItem.serviceOrderNumber && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                                {caseItem.serviceOrderNumber}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {format(caseItem.createdAt, 'dd MMM', { locale: es })}
                                    </span>
                                </div>

                                {/* Vehicle Info */}
                                <div className="flex items-center gap-3 mb-2">
                                    <Car className="h-5 w-5 text-gray-500" />
                                    <span className="text-lg font-bold text-gray-900">{caseItem.vehiclePlate}</span>
                                    <span className="text-sm text-gray-600">• {caseItem.clientName}</span>
                                </div>

                                {/* Symptom */}
                                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                    {caseItem.symptom}
                                </p>

                                {/* Footer Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {caseItem.repairStatus && (
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <span className="text-lg">{repairIcon}</span>
                                                <span>
                                                    {caseItem.repairStatus === 'pending-inspection' && 'Inspección pendiente'}
                                                    {caseItem.repairStatus === 'inspecting' && 'Inspeccionando'}
                                                    {caseItem.repairStatus === 'waiting-parts' && 'Esperando repuestos'}
                                                    {caseItem.repairStatus === 'repairing' && 'En reparación'}
                                                    {caseItem.repairStatus === 'testing' && 'Probando'}
                                                    {caseItem.repairStatus === 'completed' && 'Completado'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

