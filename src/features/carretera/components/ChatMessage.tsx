import { MessageType } from '../types/carretera.types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
    message: string;
    type: MessageType;
    timestamp?: Date;
    isTyping?: boolean;
}

export function ChatMessage({ message, type, timestamp, isTyping = false }: ChatMessageProps) {
    const isAI = type === 'ai';
    const isUser = type === 'user';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex max-w-[85%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isAI ? 'bg-blue-100' : 'bg-gray-200'
                        }`}
                >
                    {isAI ? (
                        <Bot className="h-5 w-5 text-blue-600" />
                    ) : (
                        <User className="h-5 w-5 text-gray-600" />
                    )}
                </div>

                {/* Message Content */}
                <div className="flex flex-col gap-1">
                    <div
                        className={`rounded-2xl px-4 py-3 ${isAI
                                ? 'bg-blue-50 text-gray-800'
                                : 'bg-blue-600 text-white'
                            }`}
                    >
                        {isTyping ? (
                            <div className="flex items-center gap-1">
                                <span className="animate-bounce">●</span>
                                <span className="animate-bounce delay-100">●</span>
                                <span className="animate-bounce delay-200">●</span>
                            </div>
                        ) : (
                            <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                                {message}
                            </p>
                        )}
                    </div>

                    {/* Timestamp */}
                    {timestamp && !isTyping && (
                        <span
                            className={`text-xs text-gray-500 px-2 ${isUser ? 'text-right' : 'text-left'
                                }`}
                        >
                            {timestamp.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
