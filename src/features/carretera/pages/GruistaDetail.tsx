import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Copy, Loader2, Car, User } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useGruistaCase } from '../hooks/useGruistaCase';
import { ClientQAThread } from '../components/ClientQAThread';
import { AIAssessmentSummary } from '../components/AIAssessmentSummary';
import { TrafficLightDecision } from '../components/TrafficLightDecision';

export function GruistaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { caseData, isLoading, error, submitDecision, isSubmitting, generateWorkshopLink } =
        useGruistaCase(id);

    const handleBack = () => {
        navigate('/carretera/g/dashboard');
    };

    const handleCallClient = () => {
        if (caseData) {
            window.location.href = `tel:${caseData.clientPhone}`;
        }
    };

    const handleOpenMaps = () => {
        if (caseData && caseData.location) {
            const query = encodeURIComponent(`${caseData.location} ${caseData.clientName}`);
            const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
            window.open(url, '_blank');
        }
    };

    const handleCopyLocation = async () => {
        if (caseData && caseData.location) {
            try {
                await navigator.clipboard.writeText(caseData.location);
                enqueueSnackbar('📋 Ubicación copiada', { variant: 'success' });
            } catch (err) {
                enqueueSnackbar('Error al copiar ubicación', { variant: 'error' });
            }
        }
    };

    const handleDecision = async (decision: any, notes?: string) => {
        await submitDecision(decision, notes);

        // If towing, show workshop link
        if (decision === 'tow') {
            const workshopLink = generateWorkshopLink();
            enqueueSnackbar(
                `🔴 Link del taller: ${workshopLink}`,
                { variant: 'info', autoHideDuration: 10000 }
            );
        }

        // Navigate back after 2 seconds
        setTimeout(() => {
            navigate('/carretera/g/dashboard');
        }, 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">Cargando caso...</p>
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
                            </div>
                            <p className="text-sm text-blue-100">{caseData.vehiclePlate}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Vehicle Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Car className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Información del Vehículo</h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-600">Matrícula</p>
                            <p className="text-2xl font-bold text-gray-900">{caseData.vehiclePlate}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Síntoma Reportado</p>
                            <p className="text-base text-gray-900">{caseData.symptom}</p>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Información del Cliente</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600">Nombre</p>
                            <p className="text-lg font-semibold text-gray-900">{caseData.clientName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Teléfono</p>
                            <button
                                onClick={handleCallClient}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors active:scale-95"
                            >
                                <Phone className="h-5 w-5" />
                                <span>{caseData.clientPhone}</span>
                            </button>
                        </div>
                        {caseData.location && (
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Ubicación</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleOpenMaps}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors active:scale-95"
                                    >
                                        <MapPin className="h-5 w-5" />
                                        <span>Ver en Mapa</span>
                                    </button>
                                    <button
                                        onClick={handleCopyLocation}
                                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors active:scale-95"
                                        title="Copiar ubicación"
                                    >
                                        <Copy className="h-5 w-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{caseData.location}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Q&A Thread */}
                <ClientQAThread
                    questions={caseData.questions}
                    answers={caseData.answers}
                    isCollapsible={true}
                />

                {/* AI Assessment */}
                <AIAssessmentSummary assessment={caseData.aiAssessment} />

                {/* Traffic Light Decision */}
                <TrafficLightDecision
                    aiRecommendation={caseData.aiAssessment.recommendation}
                    onDecision={handleDecision}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}
