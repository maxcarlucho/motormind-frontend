import { useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useOperatorCases } from '../hooks/useOperatorCases';
import { CreateCaseModal } from '../components/CreateCaseModal';
import { CaseListTable } from '../components/CaseListTable';
import { CaseDetailModal } from '../components/CaseDetailModal';
import { OperatorCase, AssessmentStatus } from '../types/carretera.types';
import { BackendTestButton } from '../components/BackendTestButton';
import { QuickBackendCheck } from '../components/QuickBackendCheck';
import '../debug/simpleBackendTest'; // Auto-registers simpleBackendTest() in window

export function OperatorDashboard() {
    const {
        cases,
        isLoading,
        error,
        refresh,
        filterByStatus,
        searchCases,
        filteredCases,
    } = useOperatorCases();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<AssessmentStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCase, setSelectedCase] = useState<OperatorCase | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleCreateSuccess = (caseId: string) => {
        // The case has already been created and saved by useCreateCase hook
        // Just refresh the list to show the new case
        console.log('Case created successfully with ID:', caseId);

        // Refresh the list to show the newly created case
        refresh();
    };

    const handleStatusFilter = (status: AssessmentStatus | 'all') => {
        setSelectedStatus(status);
        filterByStatus(status);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        searchCases(query);
    };

    const getStatusCount = (status: AssessmentStatus | 'all') => {
        if (status === 'all') return cases.length;
        return cases.filter((c) => c.status === status).length;
    };

    const handleCaseClick = (caseData: OperatorCase) => {
        setSelectedCase(caseData);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedCase(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <span>🚗</span>
                                <span>Asistencia en Carretera</span>
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">Panel de Operador</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Crear Nuevo Caso</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Status Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                            <button
                                onClick={() => handleStatusFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedStatus === 'all'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Todos ({getStatusCount('all')})
                            </button>
                            <button
                                onClick={() => handleStatusFilter('pending')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Pendientes ({getStatusCount('pending')})
                            </button>
                            <button
                                onClick={() => handleStatusFilter('in-progress')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedStatus === 'in-progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                En Curso ({getStatusCount('in-progress')})
                            </button>
                            <button
                                onClick={() => handleStatusFilter('completed')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedStatus === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Completados ({getStatusCount('completed')})
                            </button>
                        </div>

                        {/* Search and Refresh */}
                        <div className="flex gap-2 sm:ml-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Buscar por matrícula o cliente..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={refresh}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Actualizar"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-800">{error}</p>
                        <button
                            onClick={refresh}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <CaseListTable
                            cases={filteredCases}
                            isLoading={isLoading}
                            onCaseClick={handleCaseClick}
                        />
                    </div>
                )}
            </div>

            {/* Create Case Modal */}
            <CreateCaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Case Detail Modal */}
            {selectedCase && (
                <CaseDetailModal
                    caseData={selectedCase}
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                />
            )}

            {/* Backend Status Indicator */}
            <QuickBackendCheck />

            {/* Backend Test Button - TEMPORARY FOR DEBUGGING */}
            <BackendTestButton />
        </div>
    );
}
