import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Truck } from 'lucide-react';
import { useGruistaCases } from '../hooks/useGruistaCases';
import { GruistaCaseCard } from '../components/GruistaCaseCard';

export function GruistaDashboard() {
    const navigate = useNavigate();
    const { cases, isLoading, error, refresh, filterByStatus, filteredCases } = useGruistaCases();
    const [selectedFilter, setSelectedFilter] = useState<'new' | 'in-progress' | 'all'>('all');

    const handleFilterChange = (filter: 'new' | 'in-progress' | 'all') => {
        setSelectedFilter(filter);
        filterByStatus(filter);
    };

    const handleCaseClick = (caseId: string) => {
        navigate(`/carretera/g/${caseId}`);
    };

    const getFilterCount = (filter: 'new' | 'in-progress' | 'all') => {
        if (filter === 'all') return cases.length;
        return cases.filter((c) => c.status === filter).length;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Truck className="h-8 w-8" />
                            <div>
                                <h1 className="text-2xl font-bold">Casos Asignados</h1>
                                <p className="text-sm text-blue-100">Paco García</p>
                            </div>
                        </div>
                        <button
                            onClick={refresh}
                            disabled={isLoading}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                            title="Actualizar"
                        >
                            <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${selectedFilter === 'all'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({getFilterCount('all')})
                        </button>
                        <button
                            onClick={() => handleFilterChange('new')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${selectedFilter === 'new'
                                    ? 'bg-yellow-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🟡 Nuevos ({getFilterCount('new')})
                        </button>
                        <button
                            onClick={() => handleFilterChange('in-progress')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${selectedFilter === 'in-progress'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🔵 En Curso ({getFilterCount('in-progress')})
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {error ? (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800 font-semibold mb-3">{error}</p>
                        <button
                            onClick={refresh}
                            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Cargando casos...</p>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
                        <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay casos</h3>
                        <p className="text-gray-600">
                            {selectedFilter === 'all'
                                ? 'No tienes casos asignados en este momento'
                                : `No hay casos en estado "${selectedFilter === 'new' ? 'nuevo' : 'en curso'}"`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCases.map((caseData) => (
                            <GruistaCaseCard key={caseData.id} case={caseData} onClick={handleCaseClick} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
