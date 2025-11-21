import { Truck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrafficLightDecisionType } from '../types/carretera.types';

interface GruistaDecisionSummaryProps {
    decision: TrafficLightDecisionType;
    notes?: string;
    decidedAt: Date;
    gruistaName: string;
}

/**
 * Component to display gruista's decision and notes for workshop review
 */
export function GruistaDecisionSummary({
    decision,
    notes,
    decidedAt,
    gruistaName,
}: GruistaDecisionSummaryProps) {
    const getDecisionDisplay = () => {
        switch (decision) {
            case 'repair':
                return {
                    emoji: '🟢',
                    label: 'REPARADO IN-SITU',
                    color: 'text-green-700',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-300',
                };
            case 'info':
                return {
                    emoji: '🟡',
                    label: 'NECESITA MÁS INFO',
                    color: 'text-yellow-700',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-300',
                };
            case 'tow':
                return {
                    emoji: '🔴',
                    label: 'REMOLCAR AL TALLER',
                    color: 'text-red-700',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-300',
                };
        }
    };

    const decisionDisplay = getDecisionDisplay();
    const timeAgo = formatDistanceToNow(decidedAt, { addSuffix: true, locale: es });
    const exactTime = format(decidedAt, "dd MMM yyyy, HH:mm'h'", { locale: es });

    return (
        <div
            className={`rounded-lg border-2 ${decisionDisplay.borderColor} ${decisionDisplay.bgColor} overflow-hidden`}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                    <Truck className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Decisión del Gruista</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Decision Badge */}
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{decisionDisplay.emoji}</span>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Acción:</p>
                        <p className={`text-lg font-bold ${decisionDisplay.color}`}>
                            {decisionDisplay.label}
                        </p>
                    </div>
                </div>

                {/* Gruista Info */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Técnico:</p>
                        <p className="font-semibold text-gray-900">{gruistaName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Fecha:</p>
                        <p className="font-semibold text-gray-900">{timeAgo}</p>
                        <p className="text-xs text-gray-500">{exactTime}</p>
                    </div>
                </div>

                {/* Notes */}
                {notes && (
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Notas del Gruista:</p>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {notes}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
