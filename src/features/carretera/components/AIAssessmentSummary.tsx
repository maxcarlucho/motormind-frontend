import { Brain, TrendingUp, Clock, Loader2, CheckCircle, MessageSquare, Wrench, AlertTriangle, ListChecks } from 'lucide-react';
import { AIAssessment } from '../types/carretera.types';

interface AIAssessmentSummaryProps {
    assessment: AIAssessment;
}

/**
 * Component to display AI diagnosis status and results
 * Shows different states based on diagnosis progress
 */
export function AIAssessmentSummary({ assessment }: AIAssessmentSummaryProps) {
    const status = assessment.status || 'ready';
    const progress = assessment.clientProgress;

    // If diagnosis is not ready, show waiting/progress state
    if (status !== 'ready') {
        return <DiagnosisPendingState status={status} symptom={assessment.diagnosis} progress={progress} />;
    }

    // Diagnosis is ready - show full assessment
    return <DiagnosisReadyState assessment={assessment} />;
}

/**
 * Shows when diagnosis is still pending (client answering or generating)
 */
function DiagnosisPendingState({
    status,
    symptom,
    progress
}: {
    status: 'waiting-client' | 'client-answering' | 'generating';
    symptom: string;
    progress?: { answered: number; total: number };
}) {
    const progressPercent = progress && progress.total > 0
        ? Math.round((progress.answered / progress.total) * 100)
        : 0;

    const getStatusConfig = () => {
        switch (status) {
            case 'waiting-client':
                return {
                    icon: <Clock className="h-8 w-8" />,
                    title: 'Esperando al Cliente',
                    subtitle: 'El cliente aún no ha comenzado a responder',
                    bgGradient: 'from-gray-500 to-gray-600',
                    borderColor: 'border-gray-300',
                    bgColor: 'from-gray-50 to-gray-100',
                };
            case 'client-answering':
                return {
                    icon: <MessageSquare className="h-8 w-8" />,
                    title: 'Cliente Respondiendo',
                    subtitle: `${progress?.answered || 0} de ${progress?.total || 0} preguntas contestadas`,
                    bgGradient: 'from-blue-500 to-blue-600',
                    borderColor: 'border-blue-300',
                    bgColor: 'from-blue-50 to-indigo-50',
                };
            case 'generating':
                return {
                    icon: <Brain className="h-8 w-8 animate-pulse" />,
                    title: 'Analizando con IA',
                    subtitle: 'El cliente ha completado todas las preguntas',
                    bgGradient: 'from-purple-500 to-indigo-600',
                    borderColor: 'border-purple-300',
                    bgColor: 'from-purple-50 to-indigo-50',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`bg-gradient-to-br ${config.bgColor} rounded-lg border-2 ${config.borderColor} overflow-hidden`}>
            {/* Header */}
            <div className={`bg-gradient-to-r ${config.bgGradient} px-4 py-3`}>
                <div className="flex items-center gap-2 text-white">
                    <Brain className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Diagnóstico IA</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Status Icon */}
                    <div className={`p-4 rounded-full bg-white shadow-md text-gray-600`}>
                        {config.icon}
                    </div>

                    {/* Status Text */}
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{config.title}</h4>
                        <p className="text-gray-600">{config.subtitle}</p>
                    </div>

                    {/* Symptom */}
                    <div className="w-full bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Síntoma reportado:</p>
                        <p className="text-sm font-medium text-gray-800">{symptom}</p>
                    </div>

                    {/* Progress Bar (only for client-answering) */}
                    {status === 'client-answering' && progress && (
                        <div className="w-full">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progreso</span>
                                <span className="font-semibold text-blue-600">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Generating - Enhanced info for gruista */}
                    {status === 'generating' && (
                        <div className="w-full space-y-4">
                            {/* Processing animation */}
                            <div className="flex items-center justify-center gap-2 text-purple-600">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-sm font-medium">Procesando con IA...</span>
                            </div>

                            {/* What's happening */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200 text-left">
                                <p className="text-sm font-semibold text-purple-800 mb-3">La IA está analizando:</p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span>Respuestas del cliente</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span>Datos del vehículo</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-shrink-0" />
                                        <span>Generando diagnóstico preliminar...</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Estimated time */}
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs">Esto puede tardar 30-60 segundos</span>
                            </div>

                            {/* Tip for gruista */}
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                <p className="text-xs text-amber-700">
                                    <strong>Mientras esperas:</strong> Puedes revisar la ubicación del cliente y preparar el equipo necesario.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Shows when diagnosis is ready with full AI assessment
 * Now includes extended fields: actionSteps, risks, estimatedTime
 */
function DiagnosisReadyState({ assessment }: { assessment: AIAssessment }) {
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-600';
        if (confidence >= 60) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const getConfidenceBarColor = (confidence: number) => {
        if (confidence >= 80) return 'bg-green-500';
        if (confidence >= 60) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getRecommendationBadge = () => {
        switch (assessment.recommendation) {
            case 'repair':
                return {
                    icon: '🟢',
                    label: 'REPARAR IN-SITU',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-300',
                };
            case 'repair-failed':
                return {
                    icon: '🟡',
                    label: 'REPARACIÓN FALLIDA',
                    bgColor: 'bg-amber-100',
                    textColor: 'text-amber-800',
                    borderColor: 'border-amber-300',
                };
            case 'tow':
            default:
                return {
                    icon: '🔴',
                    label: 'REMOLCAR AL TALLER',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    borderColor: 'border-red-300',
                };
        }
    };

    const recommendationBadge = getRecommendationBadge();

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Diagnóstico IA</h3>
                    </div>
                    <div className="flex items-center gap-1 text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Listo</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Summary (new field - short headline for gruista) */}
                {assessment.summary && (
                    <div className="bg-white rounded-lg p-3 border border-indigo-200">
                        <p className="text-lg font-bold text-gray-900">
                            {assessment.summary}
                        </p>
                    </div>
                )}

                {/* Diagnosis */}
                <div>
                    <p className="text-base text-gray-900 leading-relaxed font-medium">
                        {assessment.diagnosis}
                    </p>
                </div>

                {/* Confidence & Estimated Time Row */}
                <div className="flex items-center gap-4">
                    {/* Confidence */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                Confianza
                            </span>
                            <span className={`text-lg font-bold ${getConfidenceColor(assessment.confidence)}`}>
                                {assessment.confidence}%
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getConfidenceBarColor(
                                    assessment.confidence
                                )}`}
                                style={{ width: `${assessment.confidence}%` }}
                            />
                        </div>
                    </div>

                    {/* Estimated Time (new field) */}
                    {assessment.estimatedTime && (
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">
                                {assessment.estimatedTime}
                            </span>
                        </div>
                    )}
                </div>

                {/* Recommendation */}
                <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Recomendación:</p>
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${recommendationBadge.bgColor} ${recommendationBadge.textColor} ${recommendationBadge.borderColor}`}
                    >
                        <span className="text-2xl">{recommendationBadge.icon}</span>
                        <span className="font-bold text-base">{recommendationBadge.label}</span>
                    </div>
                </div>

                {/* Reasoning */}
                {assessment.reasoning && assessment.reasoning.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            Por qué:
                        </p>
                        <ul className="space-y-2">
                            {assessment.reasoning.map((reason, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-indigo-600 font-bold mt-0.5">•</span>
                                    <span className="flex-1">{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Steps (new field) */}
                {assessment.actionSteps && assessment.actionSteps.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
                            <ListChecks className="h-4 w-4" />
                            Pasos a Seguir:
                        </p>
                        <ol className="space-y-2">
                            {assessment.actionSteps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                                    <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Risks (new field) */}
                {assessment.risks && assessment.risks.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Riesgos a Considerar:
                        </p>
                        <ul className="space-y-2">
                            {assessment.risks.map((risk, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                                    <span className="text-amber-600 font-bold mt-0.5">⚠</span>
                                    <span className="flex-1">{risk}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Alternative Consideration (new field) */}
                {assessment.alternativeConsideration && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1">
                            <Wrench className="h-4 w-4" />
                            Si la situación cambia:
                        </p>
                        <p className="text-sm text-blue-700">
                            {assessment.alternativeConsideration}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
