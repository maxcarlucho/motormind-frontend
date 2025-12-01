import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/atoms/Button';

interface ChatInterfaceProps {
    questions: string[];
    answers: string[];
    onAnswerSubmit: (answer: string) => Promise<void>;
    isLoading: boolean;
    clientName?: string;
    symptom?: string;
}

export function ChatInterface({
    questions,
    answers,
    onAnswerSubmit,
    isLoading,
    clientName,
    symptom,
}: ChatInterfaceProps) {
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [answers, questions, showTyping]);

    // Focus input when component mounts or new question appears
    useEffect(() => {
        if (!isSubmitting && answers.length < questions.length) {
            inputRef.current?.focus();
        }
    }, [answers.length, questions.length, isSubmitting]);

    const currentQuestionIndex = answers.length;
    const currentQuestion = questions[currentQuestionIndex];
    const hasMoreQuestions = currentQuestionIndex < questions.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentAnswer.trim() || isSubmitting || !hasMoreQuestions) {
            return;
        }

        try {
            setIsSubmitting(true);
            await onAnswerSubmit(currentAnswer.trim());
            setCurrentAnswer('');

            // Show typing indicator for next question
            if (currentQuestionIndex + 1 < questions.length) {
                setShowTyping(true);
                setTimeout(() => setShowTyping(false), 1000);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (but allow Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    // Generate welcome message
    const welcomeMessage = clientName
        ? `¡Hola${clientName ? ` ${clientName.split(' ')[0]}` : ''}! Soy el asistente de diagnóstico. La grúa ya está en camino hacia ti.\n\nMientras llega, necesito hacerte ${questions.length} preguntas rápidas sobre "${symptom || 'el problema de tu vehículo'}" para que el técnico llegue mejor preparado.\n\nTus respuestas nos ayudarán a determinar si podemos resolver el problema en el lugar o si necesitaremos llevarlo al taller.`
        : `¡Hola! Soy el asistente de diagnóstico. La grúa ya está en camino.\n\nNecesito hacerte ${questions.length} preguntas rápidas para ayudar al técnico a llegar mejor preparado.`;

    return (
        <div className="flex flex-col h-full">
            {/* Progress indicator */}
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 font-medium">
                        Pregunta {Math.min(answers.length + 1, questions.length)} de {questions.length}
                    </span>
                    <div className="flex-1 mx-4 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(answers.length / questions.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-blue-600 text-xs">
                        {Math.round((answers.length / questions.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {/* Welcome message - always show first */}
                <ChatMessage
                    message={welcomeMessage}
                    type="ai"
                    timestamp={new Date()}
                />

                {/* Render all previous Q&A pairs */}
                {questions.slice(0, answers.length).map((question, index) => (
                    <div key={`qa-${index}`}>
                        <ChatMessage
                            message={question}
                            type="ai"
                            timestamp={new Date()}
                        />
                        <ChatMessage
                            message={answers[index]}
                            type="user"
                            timestamp={new Date()}
                        />
                    </div>
                ))}

                {/* Current question */}
                {hasMoreQuestions && currentQuestion && (
                    <ChatMessage
                        message={currentQuestion}
                        type="ai"
                        timestamp={new Date()}
                    />
                )}

                {/* Typing indicator */}
                {showTyping && hasMoreQuestions && (
                    <ChatMessage
                        message=""
                        type="ai"
                        isTyping={true}
                    />
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {hasMoreQuestions && (
                <div className="border-t border-gray-200 bg-white p-4">
                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <div className="flex-1">
                            <textarea
                                ref={inputRef}
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe tu respuesta aquí..."
                                disabled={isSubmitting || isLoading}
                                rows={1}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                style={{
                                    minHeight: '48px',
                                    maxHeight: '120px',
                                }}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={!currentAnswer.trim() || isSubmitting || isLoading}
                            className="min-h-[48px] min-w-[52px] sm:min-w-[48px] rounded-lg px-3 sm:px-4 flex-shrink-0"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 sm:h-5 sm:w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5 sm:h-5 sm:w-5" />
                            )}
                        </Button>
                    </form>

                    {/* Helper text */}
                    <p className="mt-2 text-xs text-gray-500 text-center">
                        Presiona Enter para enviar, Shift + Enter para nueva línea
                    </p>
                </div>
            )}

            {/* All questions answered */}
            {!hasMoreQuestions && answers.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-gray-600">
                        ✓ Todas las preguntas respondidas
                    </p>
                </div>
            )}
        </div>
    );
}
