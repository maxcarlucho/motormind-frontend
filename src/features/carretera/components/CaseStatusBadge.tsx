import { AssessmentStatus } from '../types/carretera.types';

interface CaseStatusBadgeProps {
    status: AssessmentStatus;
}

/**
 * Status badge component with color-coded styling
 */
export function CaseStatusBadge({ status }: CaseStatusBadgeProps) {
    const getStatusConfig = (status: AssessmentStatus) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pendiente',
                    icon: '⏳',
                    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                };
            case 'in-progress':
                return {
                    label: 'En Curso',
                    icon: '🔄',
                    className: 'bg-blue-100 text-blue-800 border-blue-200',
                };
            case 'completed':
                return {
                    label: 'Completado',
                    icon: '✅',
                    className: 'bg-green-100 text-green-800 border-green-200',
                };
            default:
                return {
                    label: 'Desconocido',
                    icon: '❓',
                    className: 'bg-gray-100 text-gray-800 border-gray-200',
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
