import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, User, Phone, MapPin, Loader2, Cpu, Wrench } from 'lucide-react';
import { useWorkshopCase } from '../hooks/useWorkshopCase';
import { ClientQAThread } from '../components/ClientQAThread';
import { AIAssessmentSummary } from '../components/AIAssessmentSummary';
import { GruistaDecisionSummary } from '../components/GruistaDecisionSummary';
import { WorkshopActions } from '../components/WorkshopActions';
import { OBDDiagnosisForm } from '../components/OBDDiagnosisForm';

export function WorkshopReception() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { caseData, isLoading, error, acceptCase, rejectCase, submitOBDDiagnosis, isProcessing } =
        useWorkshopCase(id);
    const [showOBDForm, setShowOBDForm] = useState(false);

    const handleBack = () => {
        navigate('/carretera/t/dashboard');
    };

    const handleAccept = async () => {
        const serviceOrderNumber = await acceptCase();
        console.log('Service order created:', serviceOrderNumber);
        // Show OBD form after accepting the case
        setShowOBDForm(true);
    };

    const handleOBDSubmit = async (obdCodes: string[], comments: string) => {
        await submitOBDDiagnosis(obdCodes, comments);
        setShowOBDForm(false);
        // The AI diagnosis is generated and stored in caseData.obdDiagnosis
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-4" />
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
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const isAccepted = caseData.status === 'accepted' || caseData.status === 'in-repair';
    const isRejected = caseData.status === 'rejected';
    const isIncoming = caseData.status === 'incoming';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg sticky top-0 z-20">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">Recepción Taller</h1>
                            <p className="text-sm text-purple-100">Caso {caseData.caseNumber}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Status Banner */}
                {isAccepted && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">✅</div>
                            <div>
                                <p className="font-bold text-green-800 text-lg">Caso Aceptado</p>
                                <p className="text-sm text-green-700">
                                    Orden de servicio: <span className="font-mono font-bold">{caseData.serviceOrderNumber}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">❌</div>
                            <div>
                                <p className="font-bold text-red-800 text-lg">Caso Rechazado</p>
                                <p className="text-sm text-red-700">Este caso no fue aceptado por el taller</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vehicle Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Car className="h-5 w-5 text-indigo-600" />
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
                        <User className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-gray-900">Información del Cliente</h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-600">Nombre</p>
                            <p className="text-lg font-semibold text-gray-900">{caseData.clientName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-600" />
                            <p className="text-base text-gray-700">{caseData.clientPhone}</p>
                        </div>
                        {caseData.location && (
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                                <p className="text-sm text-gray-700">{caseData.location}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Q&A Thread */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Historial de Evaluación</h2>
                    <ClientQAThread
                        questions={caseData.questions}
                        answers={caseData.answers}
                        isCollapsible={true}
                    />
                </div>

                {/* AI Assessment */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Diagnóstico IA</h2>
                    <AIAssessmentSummary assessment={caseData.aiAssessment} />
                </div>

                {/* Gruista Decision */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Decisión del Gruista</h2>
                    <GruistaDecisionSummary
                        decision={caseData.gruistaDecision.decision}
                        notes={caseData.gruistaDecision.notes}
                        decidedAt={caseData.gruistaDecision.decidedAt}
                        gruistaName={caseData.gruistaDecision.gruistaName}
                    />
                </div>

                {/* OBD Diagnosis Section - Shows immediately after accepting */}
                {isAccepted && !caseData.obdDiagnosis && (
                    <div className="space-y-6">
                        {!showOBDForm ? (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <Cpu className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                                            Diagnóstico OBD Pendiente
                                        </h3>
                                        <p className="text-blue-800 mb-4">
                                            Conecta el escáner OBD al vehículo para obtener los códigos de error y generar un diagnóstico detallado con IA.
                                        </p>
                                        <button
                                            onClick={() => setShowOBDForm(true)}
                                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <Cpu className="h-5 w-5" />
                                            Introducir Códigos OBD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <OBDDiagnosisForm
                                onSubmit={handleOBDSubmit}
                                isProcessing={isProcessing}
                                caseNumber={caseData.caseNumber}
                                vehiclePlate={caseData.vehiclePlate}
                                symptom={caseData.symptom}
                            />
                        )}
                    </div>
                )}

                {/* AI Generated Diagnosis Results */}
                {isAccepted && caseData.obdDiagnosis && (
                    <div className="space-y-6">
                        {/* OBD Codes Summary */}
                        <div className="bg-white rounded-lg border-2 border-indigo-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                                <div className="flex items-center gap-2 text-white">
                                    <Cpu className="h-5 w-5" />
                                    <h3 className="font-bold text-lg">Diagnóstico OBD Completado</h3>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Códigos OBD detectados:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {caseData.obdDiagnosis.obdCodes?.map((code: string, index: number) => (
                                            <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 font-mono font-semibold rounded-lg">
                                                {code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {caseData.obdDiagnosis.technicianComments && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Observaciones del técnico:</p>
                                        <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                                            {caseData.obdDiagnosis.technicianComments}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Generated Possible Failures and Solutions */}
                        <div className="bg-white rounded-lg border-2 border-green-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3">
                                <div className="flex items-center gap-2 text-white">
                                    <Wrench className="h-5 w-5" />
                                    <h3 className="font-bold text-lg">Posibles Averías y Soluciones</h3>
                                </div>
                            </div>
                            <div className="p-4">
                                {caseData.obdDiagnosis.diagnosisGenerated && caseData.obdDiagnosis.failures ? (
                                    <div className="space-y-4">
                                        {caseData.obdDiagnosis.failures.map((failure: any, index: number) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start gap-2 mb-3">
                                                    <span className="text-2xl flex-shrink-0">
                                                        {index === 0 ? '🔴' : index === 1 ? '🟡' : '🟢'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 mb-1">
                                                            {failure.part || `Avería ${index + 1}`}
                                                        </h4>
                                                        {failure.probability && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-sm text-gray-600">Probabilidad:</span>
                                                                <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${
                                                                            failure.probability > 75 ? 'bg-red-500' :
                                                                            failure.probability > 50 ? 'bg-yellow-500' :
                                                                            'bg-green-500'
                                                                        }`}
                                                                        style={{ width: `${failure.probability}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-semibold">{failure.probability}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-gray-700 mb-3">{failure.description}</p>

                                                {failure.steps && failure.steps.length > 0 && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                                            Pasos para solucionar:
                                                        </p>
                                                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                                                            {failure.steps.map((step: string, stepIndex: number) => (
                                                                <li key={stepIndex}>{step}</li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}

                                                {failure.estimatedTime && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        ⏱ Tiempo estimado: {failure.estimatedTime}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                                            <p className="text-amber-800 text-sm">
                                                <strong>⏳ Generando diagnóstico con IA...</strong>
                                                <br/>El análisis de posibles averías se está procesando basándose en:
                                            </p>
                                            <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
                                                <li>Códigos OBD: {caseData.obdDiagnosis.obdCodes?.join(', ')}</li>
                                                <li>Síntoma: {caseData.symptom}</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Workshop Actions (only if incoming) */}
                {isIncoming && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Acciones</h2>
                        <WorkshopActions
                            onAccept={handleAccept}
                            onReject={rejectCase}
                            isProcessing={isProcessing}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
