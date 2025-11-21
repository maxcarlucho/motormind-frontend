import { MapPin, Clock } from 'lucide-react';
import { GruistaCaseDetailed } from '../types/carretera.types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface GruistaCaseCardProps {
    case: GruistaCaseDetailed;
    onClick: (id: string) => void;
}

/**
 * Card component for displaying gruista case summary in list
 */
export function GruistaCaseCard({ case: caseData, onClick }: GruistaCaseCardProps) {
    const getStatusConfig = (status: GruistaCaseDetailed['status']) => {
        switch (status) {
            case 'new':
                return {
                    label: 'NUEVO',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    borderColor: 'border-yellow-300',
                };
            case 'in-progress':
                return {
                    label: 'EN CURSO',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800',
                    borderColor: 'border-blue-300',
                };
            case 'completed':
                return {
                    label: 'COMPLETADO',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-300',
                };
            case 'needs-info':
                return {
                    label: 'NECESITA INFO',
                    bgColor: 'bg-orange-100',
                    textColor: 'text-orange-800',
                    borderColor: 'border-orange-300',
                };
            case 'towing':
                return {
                    label: 'REMOLCANDO',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    borderColor: 'border-red-300',
                };
            default:
                return {
                    label: 'DESCONOCIDO',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-300',
                };
        }
    };

    const statusConfig = getStatusConfig(caseData.status);

    return (
        <div
            onClick={() => onClick(caseData.id)}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
        >
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-3">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                >
                    {statusConfig.label}
                </span>
                <span className="text-xs font-mono text-gray-500">{caseData.caseNumber}</span>
            </div>

            {/* Main Info */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{caseData.vehiclePlate}</span>
                </div>
                <div className="text-base font-semibold text-gray-900">{caseData.clientName}</div>
                <div className="text-sm text-gray-700 line-clamp-2">{caseData.symptom}</div>
            </div>

            {/* Location */}
            {caseData.location && (
                <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    <span className="line-clamp-1">{caseData.location}</span>
                </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>
                    Hace {formatDistanceToNow(caseData.createdAt, { locale: es })}
                </span>
            </div>

            {/* Action Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(caseData.id);
                }}
                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-base"
            >
                Ver Detalles →
            </button>
        </div>
    );
}
