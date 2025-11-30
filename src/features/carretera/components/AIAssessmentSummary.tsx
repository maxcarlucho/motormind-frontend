import { Brain, Clock, Loader2, CheckCircle, MessageSquare, AlertTriangle } from 'lucide-react';
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
 * Extrae puntos clave de un texto largo de diagnóstico
 * Busca frases cortas y relevantes para el gruista
 */
function extractKeyPoints(reasoning: string[]): string[] {
    const keyPoints: string[] = [];

    for (const text of reasoning) {
        // Dividir por puntos, "•", o saltos de línea
        const sentences = text.split(/[.•\n]+/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 100);

        for (const sentence of sentences) {
            // Priorizar frases con palabras clave importantes para gruista
            const isImportant = /riesgo|seguridad|peligro|urgente|inmediato|fallo|defectuoso|reparar|remolcar|taller/i.test(sentence);

            if (isImportant && keyPoints.length < 3) {
                // Limpiar y capitalizar
                const cleaned = sentence.charAt(0).toUpperCase() + sentence.slice(1);
                if (!keyPoints.includes(cleaned)) {
                    keyPoints.push(cleaned);
                }
            }
        }
    }

    // Si no encontramos frases importantes, tomar las primeras cortas
    if (keyPoints.length === 0) {
        for (const text of reasoning) {
            const sentences = text.split(/[.•\n]+/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 80);
            if (sentences.length > 0 && keyPoints.length < 2) {
                keyPoints.push(sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1));
            }
        }
    }

    return keyPoints.slice(0, 3);
}

/**
 * Shows when diagnosis is ready with full AI assessment
 * CONCISO: Datos clave para que el gruista tome decisión rápida
 */
function DiagnosisReadyState({ assessment }: { assessment: AIAssessment }) {
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-600 bg-green-100';
        if (confidence >= 60) return 'text-amber-600 bg-amber-100';
        return 'text-red-600 bg-red-100';
    };

    const getRecommendationConfig = () => {
        switch (assessment.recommendation) {
            case 'repair':
                return {
                    icon: '🟢',
                    label: 'REPARABLE',
                    bgColor: 'bg-green-500',
                    textColor: 'text-white',
                };
            case 'tow':
            default:
                return {
                    icon: '🔴',
                    label: 'REMOLCAR',
                    bgColor: 'bg-red-500',
                    textColor: 'text-white',
                };
        }
    };

    const rec = getRecommendationConfig();

    // Extraer puntos clave del reasoning largo
    const keyPoints = assessment.reasoning && assessment.reasoning.length > 0
        ? extractKeyPoints(assessment.reasoning)
        : [];

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Header compacto */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Brain className="h-4 w-4" />
                    <span className="font-semibold text-sm">Diagnóstico IA</span>
                </div>
                <div className="flex items-center gap-1 text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Listo</span>
                </div>
            </div>

            {/* Contenido principal - MUY CONCISO */}
            <div className="p-4 space-y-3">
                {/* Fila 1: Recomendación + Confianza (lo más importante arriba) */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Badge de recomendación grande */}
                    <div className={`${rec.bgColor} ${rec.textColor} px-4 py-2 rounded-lg flex items-center gap-2`}>
                        <span className="text-xl">{rec.icon}</span>
                        <span className="font-bold">{rec.label}</span>
                    </div>
                    {/* Confianza */}
                    <div className={`px-3 py-2 rounded-lg ${getConfidenceColor(assessment.confidence)}`}>
                        <span className="font-bold">{assessment.confidence}%</span>
                        <span className="text-xs ml-1 opacity-75">confianza</span>
                    </div>
                    {/* Tiempo estimado */}
                    {assessment.estimatedTime && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{assessment.estimatedTime}</span>
                        </div>
                    )}
                </div>

                {/* Diagnóstico - una línea clara */}
                <div className="border-l-4 border-indigo-500 pl-3 py-1">
                    <p className="font-semibold text-gray-900">{assessment.diagnosis}</p>
                </div>

                {/* Por qué - puntos clave extraídos, como bullets */}
                {keyPoints.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Por qué</p>
                        <ul className="space-y-1">
                            {keyPoints.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Riesgo si existe - destacado */}
                {assessment.risks && assessment.risks.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Riesgo: </span>
                            <span>{assessment.risks[0].length > 100 ? assessment.risks[0].substring(0, 100) + '...' : assessment.risks[0]}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
