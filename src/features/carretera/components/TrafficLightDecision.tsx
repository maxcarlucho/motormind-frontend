import { useState } from 'react';
import { Wrench, Truck, Loader2 } from 'lucide-react';
import { TrafficLightDecisionType } from '../types/carretera.types';

interface TrafficLightDecisionProps {
    aiRecommendation: TrafficLightDecisionType;
    onDecision: (decision: TrafficLightDecisionType, notes?: string) => Promise<void>;
    isSubmitting: boolean;
}

interface DecisionOption {
    value: TrafficLightDecisionType;
    icon: typeof Wrench;
    emoji: string;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    hoverColor: string;
    borderColor: string;
    activeBg: string;
}

/**
 * Traffic light decision interface for gruista
 */
export function TrafficLightDecision({
    aiRecommendation,
    onDecision,
    isSubmitting,
}: TrafficLightDecisionProps) {
    const [selectedDecision, setSelectedDecision] = useState<TrafficLightDecisionType | null>(null);
    const [notes, setNotes] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const options: DecisionOption[] = [
        {
            value: 'repair',
            icon: Wrench,
            emoji: '🟢',
            label: 'Reparar In-Situ',
            description: 'Solución simple, no requiere taller',
            color: 'text-green-700',
            bgColor: 'bg-green-50',
            hoverColor: 'hover:bg-green-100',
            borderColor: 'border-green-300',
            activeBg: 'bg-green-100',
        },
        {
            value: 'tow',
            icon: Truck,
            emoji: '🔴',
            label: 'Remolcar al Taller',
            description: 'Reparación compleja, requiere taller',
            color: 'text-red-700',
            bgColor: 'bg-red-50',
            hoverColor: 'hover:bg-red-100',
            borderColor: 'border-red-300',
            activeBg: 'bg-red-100',
        },
    ];

    const handleDecisionClick = (decision: TrafficLightDecisionType) => {
        setSelectedDecision(decision);
        setShowConfirmDialog(true);
    };

    const handleConfirm = async () => {
        if (!selectedDecision) return;

        await onDecision(selectedDecision, notes || undefined);
        setShowConfirmDialog(false);
        setNotes('');
        setSelectedDecision(null);
    };

    const handleCancel = () => {
        setShowConfirmDialog(false);
        setNotes('');
        setSelectedDecision(null);
    };

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="flex items-center gap-2">
                <span className="text-2xl">🚦</span>
                <h3 className="text-xl font-bold text-gray-900">Tu Decisión</h3>
            </div>

            {/* Decision Cards */}
            <div className="space-y-3">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isRecommended = option.value === aiRecommendation;

                    return (
                        <button
                            key={option.value}
                            onClick={() => handleDecisionClick(option.value)}
                            disabled={isSubmitting}
                            className={`
                w-full text-left p-4 rounded-xl border-3 transition-all
                ${option.bgColor} ${option.borderColor} ${option.hoverColor}
                hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isRecommended ? 'ring-4 ring-blue-300 ring-offset-2' : ''}
              `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Emoji */}
                                <div className="text-4xl flex-shrink-0">{option.emoji}</div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={`h-5 w-5 ${option.color}`} />
                                        <h4 className={`font-bold text-lg ${option.color}`}>{option.label}</h4>
                                        {isRecommended && (
                                            <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                                                IA Recomienda
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Confirmation Dialog with Optional Notes */}
            {showConfirmDialog && selectedDecision && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Confirmar Decisión</h3>
                        <p className="text-base text-gray-700">
                            ¿Estás seguro de que quieres marcar este caso como{' '}
                            <span className="font-bold">
                                {selectedDecision === 'repair' ? 'REPARADO IN-SITU' : 'PARA REMOLCAR'}
                            </span>
                            ?
                        </p>
                        {selectedDecision === 'tow' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    Se generara automaticamente un link para el taller
                                </p>
                            </div>
                        )}
                        {/* Optional Notes Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas (opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej: Batería descargada, cliente menciona que dejó las luces encendidas..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-base resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    'Confirmar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
