import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Loader2, Cpu, Wrench, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { useWorkshopCase } from '../hooks/useWorkshopCase';
import { ClientQAThread } from '../components/ClientQAThread';
import { AIAssessmentSummary } from '../components/AIAssessmentSummary';
import { GruistaDecisionSummary } from '../components/GruistaDecisionSummary';
import { WorkshopActions } from '../components/WorkshopActions';
import { OBDDiagnosisForm } from '../components/OBDDiagnosisForm';
import { WorkshopWelcomeModal } from '../components/WorkshopWelcomeModal';
import { useAccessToken } from '../components/RequireAccessToken';

export function WorkshopReception() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Get validated token data from RequireAccessToken context
    // The raw token is passed to useWorkshopCase for API calls (works in incognito)
    const { carId: tokenCarId, diagnosisId: tokenDiagnosisId, token: urlToken } = useAccessToken();

    const { caseData, isLoading, error, acceptCase, rejectCase, submitOBDDiagnosis, isProcessing } =
        useWorkshopCase(id, { carId: tokenCarId, diagnosisId: tokenDiagnosisId, urlToken });
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [showMoreInfo, setShowMoreInfo] = useState(false);

    // Show welcome modal for incoming cases (first time viewing)
    useEffect(() => {
        if (caseData && caseData.status === 'incoming') {
            const shownModalKey = `workshop_welcome_shown_${id}`;
            const hasShownModal = sessionStorage.getItem(shownModalKey);
            if (!hasShownModal) {
                setShowWelcomeModal(true);
                sessionStorage.setItem(shownModalKey, 'true');
            }
        }
    }, [caseData, id]);

    const handleBack = () => {
        navigate('/carretera/t/dashboard');
    };

    const handleAccept = async () => {
        const serviceOrderNumber = await acceptCase();
        console.log('Service order created:', serviceOrderNumber);
        // El estado cambia a 'accepted' y el componente renderiza el formulario OBD
    };

    // Al cerrar el modal de bienvenida, aceptar automáticamente el caso
    const handleWelcomeAccept = async () => {
        setShowWelcomeModal(false);
        // Auto-aceptar el caso para ir directo al OBD
        await handleAccept();
    };

    const handleOBDSubmit = async (obdCodes: string[], comments: string) => {
        await submitOBDDiagnosis(obdCodes, comments);
        // El estado cambia y muestra los resultados
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">Cargando...</p>
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
                        className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
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
    const hasOBDDiagnosis = isAccepted && caseData.obdDiagnosis;
    const needsOBD = isAccepted && !caseData.obdDiagnosis;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Welcome Modal - Al aceptar, va directo al OBD */}
            {showWelcomeModal && caseData && (
                <WorkshopWelcomeModal
                    caseNumber={caseData.caseNumber}
                    vehiclePlate={caseData.vehiclePlate}
                    symptom={caseData.symptom}
                    clientName={caseData.clientName}
                    gruistaDecision={caseData.gruistaDecision?.decision || 'tow'}
                    onClose={() => setShowWelcomeModal(false)}
                    onAccept={handleWelcomeAccept}
                />
            )}

            {/* Header - Compact */}
            <div className="bg-slate-800 text-white sticky top-0 z-20">
                <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex-1 flex items-center gap-3">
                            <Car className="h-6 w-6 text-slate-400" />
                            <span className="text-xl font-bold font-mono">{caseData.vehiclePlate}</span>
                        </div>
                        {isAccepted && caseData.serviceOrderNumber && (
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                                OS: {caseData.serviceOrderNumber}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* STEP 1: Incoming - Accept or Reject */}
                {isIncoming && (
                    <>
                        {/* The Problem */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-amber-500 px-4 py-2">
                                <p className="text-white font-bold text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    PROBLEMA REPORTADO
                                </p>
                            </div>
                            <div className="p-4">
                                <p className="text-gray-800 text-lg">{caseData.symptom?.split('[ASISTENCIA')[0]?.trim() || caseData.symptom}</p>
                                <p className="text-gray-500 text-sm mt-2">Cliente: {caseData.clientName} · {caseData.clientPhone}</p>
                            </div>
                        </div>

                        {/* Accept/Reject Actions */}
                        <WorkshopActions
                            onAccept={handleAccept}
                            onReject={rejectCase}
                            isProcessing={isProcessing}
                        />

                        {/* Expandable: More Info */}
                        <button
                            onClick={() => setShowMoreInfo(!showMoreInfo)}
                            className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            {showMoreInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {showMoreInfo ? 'Ocultar detalles' : 'Ver más detalles del caso'}
                        </button>

                        {showMoreInfo && (
                            <div className="space-y-4">
                                <ClientQAThread
                                    questions={caseData.questions}
                                    answers={caseData.answers}
                                    isCollapsible={false}
                                />
                                <AIAssessmentSummary assessment={caseData.aiAssessment} />
                                <GruistaDecisionSummary
                                    decision={caseData.gruistaDecision.decision}
                                    notes={caseData.gruistaDecision.notes}
                                    decidedAt={caseData.gruistaDecision.decidedAt}
                                    gruistaName={caseData.gruistaDecision.gruistaName}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Rejected State */}
                {isRejected && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                        <div className="text-5xl mb-3">❌</div>
                        <p className="font-bold text-red-800 text-lg">Caso Rechazado</p>
                        <p className="text-red-600 text-sm mt-1">Este caso no fue aceptado</p>
                    </div>
                )}

                {/* STEP 2: Accepted - Need OBD Codes */}
                {needsOBD && (
                    <OBDDiagnosisForm
                        onSubmit={handleOBDSubmit}
                        isProcessing={isProcessing}
                        caseNumber={caseData.caseNumber}
                        vehiclePlate={caseData.vehiclePlate}
                        symptom={caseData.symptom || ''}
                        clientName={caseData.clientName}
                        questions={caseData.questions}
                        answers={caseData.answers}
                        aiAssessment={caseData.aiAssessment}
                    />
                )}

                {/* STEP 3: Has OBD Diagnosis - Show Results */}
                {hasOBDDiagnosis && (
                    <>
                        {/* Success Banner */}
                        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="font-bold text-green-800">Diagnóstico Completado</p>
                                    <p className="text-green-700 text-sm">
                                        Orden: <span className="font-mono font-bold">{caseData.serviceOrderNumber}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* OBD Codes */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-slate-700 px-4 py-2">
                                <p className="text-white font-bold text-sm flex items-center gap-2">
                                    <Cpu className="h-4 w-4" />
                                    CÓDIGOS OBD
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {caseData.obdDiagnosis.obdCodes?.map((code: string, index: number) => (
                                        <span key={index} className="px-3 py-2 bg-slate-100 text-slate-800 font-mono font-bold rounded-lg text-lg">
                                            {code}
                                        </span>
                                    ))}
                                </div>
                                {caseData.obdDiagnosis.technicianComments && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Tus observaciones</p>
                                        <p className="text-gray-700 text-sm">{caseData.obdDiagnosis.technicianComments}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Diagnosis Results */}
                        <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
                                <p className="text-white font-bold flex items-center gap-2">
                                    <Wrench className="h-5 w-5" />
                                    POSIBLES AVERÍAS
                                </p>
                            </div>
                            <div className="p-4">
                                {caseData.obdDiagnosis.diagnosisGenerated && Array.isArray(caseData.obdDiagnosis.failures) && caseData.obdDiagnosis.failures.length > 0 ? (
                                    <div className="space-y-4">
                                        {caseData.obdDiagnosis.failures.map((failure: any, index: number) => (
                                            <div key={index} className={`p-4 rounded-lg ${index === 0 ? 'bg-red-50 border-2 border-red-200' : index === 1 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">
                                                        {index === 0 ? '🔴' : index === 1 ? '🟡' : '🟢'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-bold text-gray-900">
                                                                {failure.part || `Posible avería ${index + 1}`}
                                                            </h4>
                                                            {failure.probability && (
                                                                <span className={`text-sm font-bold px-2 py-1 rounded ${failure.probability > 75 ? 'bg-red-200 text-red-800' : failure.probability > 50 ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'}`}>
                                                                    {failure.probability}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-700 text-sm mb-3">{failure.description}</p>

                                                        {failure.steps && failure.steps.length > 0 && (
                                                            <div className="bg-white rounded-lg p-3 border">
                                                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cómo solucionarlo:</p>
                                                                <ol className="text-sm text-gray-700 space-y-1">
                                                                    {failure.steps.map((step: string, stepIndex: number) => (
                                                                        <li key={stepIndex} className="flex gap-2">
                                                                            <span className="font-bold text-gray-400">{stepIndex + 1}.</span>
                                                                            <span>{step}</span>
                                                                        </li>
                                                                    ))}
                                                                </ol>
                                                            </div>
                                                        )}

                                                        {failure.estimatedTime && (
                                                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                Tiempo estimado: {failure.estimatedTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-10 w-10 animate-spin text-green-500 mx-auto mb-3" />
                                        <p className="font-semibold text-gray-700">Analizando códigos OBD...</p>
                                        <p className="text-sm text-gray-500 mt-1">El diagnóstico estará listo en unos segundos</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Collapsible: Full History */}
                        <button
                            onClick={() => setShowMoreInfo(!showMoreInfo)}
                            className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            {showMoreInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {showMoreInfo ? 'Ocultar historial' : 'Ver historial completo'}
                        </button>

                        {showMoreInfo && (
                            <div className="space-y-4 pb-8">
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Problema original</p>
                                    <p className="text-gray-800">{caseData.symptom?.split('[ASISTENCIA')[0]?.trim() || caseData.symptom}</p>
                                    <p className="text-gray-500 text-sm mt-2">Cliente: {caseData.clientName} · {caseData.clientPhone}</p>
                                </div>
                                <ClientQAThread
                                    questions={caseData.questions}
                                    answers={caseData.answers}
                                    isCollapsible={false}
                                />
                                <AIAssessmentSummary assessment={caseData.aiAssessment} />
                                <GruistaDecisionSummary
                                    decision={caseData.gruistaDecision.decision}
                                    notes={caseData.gruistaDecision.notes}
                                    decidedAt={caseData.gruistaDecision.decidedAt}
                                    gruistaName={caseData.gruistaDecision.gruistaName}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
