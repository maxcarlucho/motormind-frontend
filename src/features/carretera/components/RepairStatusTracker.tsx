import { useState } from 'react';
import { Wrench, ChevronDown, Check } from 'lucide-react';
import { WorkshopRepairStatus } from '../types/carretera.types';

interface RepairStatusTrackerProps {
    currentStatus: WorkshopRepairStatus;
    onUpdateStatus: (status: WorkshopRepairStatus) => Promise<void>;
    isProcessing: boolean;
}

interface StatusStep {
    value: WorkshopRepairStatus;
    label: string;
    icon: string;
}

const statusSteps: StatusStep[] = [
    { value: 'pending-inspection', label: 'Inspección Pendiente', icon: '⏳' },
    { value: 'inspecting', label: 'Inspeccionando', icon: '🔍' },
    { value: 'waiting-parts', label: 'Esperando Repuestos', icon: '📦' },
    { value: 'repairing', label: 'Reparando', icon: '🔧' },
    { value: 'testing', label: 'Probando', icon: '✅' },
    { value: 'completed', label: 'Completado', icon: '🎉' },
];

/**
 * Component to track and update repair status in workshop
 */
export function RepairStatusTracker({
    currentStatus,
    onUpdateStatus,
    isProcessing,
}: RepairStatusTrackerProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    const currentIndex = statusSteps.findIndex((s) => s.value === currentStatus);
    const currentStep = statusSteps[currentIndex];

    const handleStatusChange = async (newStatus: WorkshopRepairStatus) => {
        setShowDropdown(false);
        if (newStatus !== currentStatus) {
            await onUpdateStatus(newStatus);
        }
    };

    const getStepStatus = (index: number): 'completed' | 'current' | 'pending' => {
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'pending';
    };

    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                    <Wrench className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Estado de Reparación</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Timeline */}
                <div className="space-y-3">
                    {statusSteps.map((step, index) => {
                        const stepStatus = getStepStatus(index);

                        return (
                            <div key={step.value} className="flex items-start gap-3">
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${stepStatus === 'completed'
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : stepStatus === 'current'
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'bg-gray-100 border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {stepStatus === 'completed' ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <span>{step.icon}</span>
                                    )}
                                </div>

                                {/* Label */}
                                <div className="flex-1 pt-1">
                                    <p
                                        className={`text-base font-semibold ${stepStatus === 'completed'
                                                ? 'text-green-700'
                                                : stepStatus === 'current'
                                                    ? 'text-blue-700'
                                                    : 'text-gray-400'
                                            }`}
                                    >
                                        {step.label}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Update Status Dropdown */}
                <div className="pt-3 border-t border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Actualizar Estado:
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            disabled={isProcessing}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-left flex items-center justify-between hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-2xl">{currentStep.icon}</span>
                                <span className="font-semibold text-gray-900">{currentStep.label}</span>
                            </span>
                            <ChevronDown
                                className={`h-5 w-5 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {showDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                {statusSteps.map((step) => (
                                    <button
                                        key={step.value}
                                        onClick={() => handleStatusChange(step.value)}
                                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${step.value === currentStatus ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <span className="text-2xl">{step.icon}</span>
                                        <span
                                            className={`font-medium ${step.value === currentStatus ? 'text-blue-700' : 'text-gray-700'
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                        {step.value === currentStatus && (
                                            <Check className="h-5 w-5 text-blue-600 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
