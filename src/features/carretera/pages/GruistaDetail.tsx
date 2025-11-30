import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useGruistaCase } from '../hooks/useGruistaCase';
import { ClientQAThread } from '../components/ClientQAThread';
import { AIAssessmentSummary } from '../components/AIAssessmentSummary';
import { TrafficLightDecision } from '../components/TrafficLightDecision';
import { WorkshopLinkModal } from '../components/WorkshopLinkModal';

export function GruistaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { caseData, isLoading, error, submitDecision, isSubmitting, generateWorkshopLink, refresh, isRefreshing } =
        useGruistaCase(id);

    const [showWorkshopModal, setShowWorkshopModal] = useState(false);
    const [workshopLink, setWorkshopLink] = useState('');

    const handleBack = () => {
        navigate('/carretera/g/dashboard');
    };

    const handleDecision = async (decision: any, notes?: string) => {
        await submitDecision(decision, notes);

        // If towing, generate workshop link and show modal
        if (decision === 'tow') {
            const link = await generateWorkshopLink();
            setWorkshopLink(link);
            setShowWorkshopModal(true);
            // Don't auto-navigate, let user close modal
        } else {
            // For repair, show success and navigate back
            enqueueSnackbar('Decisión guardada: Reparar in-situ', { variant: 'success' });
            setTimeout(() => {
                navigate('/carretera/g/dashboard');
            }, 1500);
        }
    };

    const handleCloseWorkshopModal = () => {
        setShowWorkshopModal(false);
        navigate('/carretera/g/dashboard');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-2">Cargando caso...</p>
                    <p className="text-sm text-gray-500">
                        Obteniendo información del vehículo y diagnóstico IA
                    </p>
                </div>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error || 'Caso no encontrado'}</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Workshop Link Modal */}
            {showWorkshopModal && caseData && (
                <WorkshopLinkModal
                    isOpen={showWorkshopModal}
                    workshopLink={workshopLink}
                    vehiclePlate={caseData.vehiclePlate}
                    symptom={caseData.symptom}
                    onClose={handleCloseWorkshopModal}
                />
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-20">
                <div className=" px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold">Caso {caseData.caseNumber}</h1>
                                {isRefreshing && (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-200" />
                                )}
                            </div>
                            <p className="text-sm text-blue-100">{caseData.vehiclePlate}</p>
                        </div>
                        {/* Manual refresh button */}
                        <button
                            onClick={refresh}
                            disabled={isRefreshing}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                            title="Actualizar"
                        >
                            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Case Info - Unified card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Matrícula</p>
                            <p className="text-2xl font-bold text-gray-900">{caseData.vehiclePlate}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="text-lg font-semibold text-gray-900">{caseData.clientName}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500 mb-1">Sintoma</p>
                        <p className="text-base text-gray-900">{caseData.symptom}</p>
                    </div>

                    {caseData.location && (
                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <p className="text-sm text-gray-500 mb-1">Ubicacion</p>
                            <p className="text-sm text-gray-700">{caseData.location}</p>
                        </div>
                    )}
                </div>

                {/* Q&A Thread */}
                <ClientQAThread
                    questions={caseData.questions}
                    answers={caseData.answers}
                    isCollapsible={true}
                />

                {/* AI Assessment */}
                <AIAssessmentSummary assessment={caseData.aiAssessment} />

                {/* Traffic Light Decision - Only show when diagnosis is ready */}
                {caseData.aiAssessment.status === 'ready' ? (
                    <TrafficLightDecision
                        aiRecommendation={caseData.aiAssessment.recommendation}
                        onDecision={handleDecision}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <div className="bg-gray-100 rounded-lg p-6 text-center">
                        <p className="text-gray-600 font-medium">
                            Los botones de decisión aparecerán cuando el diagnóstico IA esté listo
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
