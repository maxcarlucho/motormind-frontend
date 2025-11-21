import { Brain, TrendingUp } from 'lucide-react';
import { AIAssessment } from '../types/carretera.types';

interface AIAssessmentSummaryProps {
    assessment: AIAssessment;
}

/**
 * Component to display AI diagnosis and confidence level
 */
export function AIAssessmentSummary({ assessment }: AIAssessmentSummaryProps) {
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
            case 'info':
                return {
                    icon: '🟡',
                    label: 'NECESITA MÁS INFO',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    borderColor: 'border-yellow-300',
                };
            case 'tow':
                return {
                    icon: '🔴',
                    label: 'REMOLCAR',
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
                <div className="flex items-center gap-2 text-white">
                    <Brain className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Diagnóstico IA</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Diagnosis */}
                <div>
                    <p className="text-base text-gray-900 leading-relaxed font-medium">
                        {assessment.diagnosis}
                    </p>
                </div>

                {/* Confidence */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Nivel de Confianza
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
                        <p className="text-sm font-semibold text-gray-700 mb-2">Razones:</p>
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
            </div>
        </div>
    );
}
