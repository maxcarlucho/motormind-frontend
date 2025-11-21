import { MessageCircle, User } from 'lucide-react';
import { useState } from 'react';

interface ClientQAThreadProps {
    questions: string[];
    answers: string[];
    isCollapsible?: boolean;
}

/**
 * Component to display client's question-answer thread
 */
export function ClientQAThread({ questions, answers, isCollapsible = true }: ClientQAThreadProps) {
    const [isExpanded, setIsExpanded] = useState(!isCollapsible);

    const qaPairs = questions.map((question, index) => ({
        question,
        answer: answers[index] || 'Sin respuesta',
    }));

    const displayedPairs = isExpanded ? qaPairs : qaPairs.slice(0, 2);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Evaluación del Cliente</h3>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                        {qaPairs.length} preguntas
                    </span>
                </div>
            </div>

            {/* Q&A List */}
            <div className="divide-y divide-gray-100">
                {displayedPairs.map((pair, index) => (
                    <div key={index} className="p-4 space-y-3">
                        {/* Question */}
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                    {pair.question}
                                </p>
                            </div>
                        </div>

                        {/* Answer */}
                        <div className="flex items-start gap-3 ml-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                    <p className="text-sm text-gray-700 leading-relaxed">{pair.answer}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Expand/Collapse Button */}
            {isCollapsible && qaPairs.length > 2 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        {isExpanded ? '▲ Ver menos' : `▼ Ver todas (${qaPairs.length})`}
                    </button>
                </div>
            )}
        </div>
    );
}
