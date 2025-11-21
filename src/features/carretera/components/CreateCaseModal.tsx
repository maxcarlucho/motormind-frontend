import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CaseFormData } from '../types/carretera.types';
import { useCreateCase } from '../hooks/useCreateCase';

interface CreateCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (caseId: string) => void;
}

/**
 * Modal dialog for creating new roadside assistance cases
 */
export function CreateCaseModal({ isOpen, onClose, onSuccess }: CreateCaseModalProps) {
    const { createCase, isCreating, reset } = useCreateCase();

    const [formData, setFormData] = useState<CaseFormData>({
        vehiclePlate: '',
        symptom: '',
        clientName: '',
        clientPhone: '',
        location: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CaseFormData, string>>>({});

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                vehiclePlate: '',
                symptom: '',
                clientName: '',
                clientPhone: '',
                location: '',
                notes: '',
            });
            setErrors({});
            reset();
        }
    }, [isOpen, reset]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CaseFormData, string>> = {};

        // Vehicle plate validation (Spanish format)
        const plateRegex = /^[0-9]{4}[A-Z]{3}$|^[A-Z]{1,2}[0-9]{4}[A-Z]{2}$/;
        if (!formData.vehiclePlate) {
            newErrors.vehiclePlate = 'La matrícula es obligatoria';
        } else if (!plateRegex.test(formData.vehiclePlate.toUpperCase().replace(/\s/g, ''))) {
            newErrors.vehiclePlate = 'Formato inválido (ej: ABC1234 o 1234ABC)';
        }

        // Symptom validation
        if (!formData.symptom) {
            newErrors.symptom = 'El síntoma es obligatorio';
        } else if (formData.symptom.length < 10) {
            newErrors.symptom = 'Describe el síntoma con más detalle (mín. 10 caracteres)';
        }

        // Client name validation
        if (!formData.clientName) {
            newErrors.clientName = 'El nombre es obligatorio';
        } else if (formData.clientName.trim().split(' ').length < 2) {
            newErrors.clientName = 'Ingresa nombre y apellido';
        }

        // Phone validation (Spanish format)
        const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
        const cleanPhone = formData.clientPhone.replace(/\s/g, '');
        if (!formData.clientPhone) {
            newErrors.clientPhone = 'El teléfono es obligatorio';
        } else if (!phoneRegex.test(cleanPhone)) {
            newErrors.clientPhone = 'Formato inválido (ej: +34 600 123 456)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const caseId = await createCase(formData);
            onSuccess(caseId);
            onClose();
        } catch (err) {
            // Error is handled in the hook
            console.error('Failed to create case:', err);
        }
    };

    const handleChange = (field: keyof CaseFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Caso</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            disabled={isCreating}
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Vehicle Plate */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Matrícula del Vehículo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.vehiclePlate}
                                onChange={(e) => handleChange('vehiclePlate', e.target.value.toUpperCase())}
                                placeholder="ABC1234"
                                className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 ${errors.vehiclePlate
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={isCreating}
                            />
                            {errors.vehiclePlate && (
                                <p className="mt-1 text-sm text-red-600">{errors.vehiclePlate}</p>
                            )}
                        </div>

                        {/* Symptom */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Síntoma Inicial <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.symptom}
                                onChange={(e) => handleChange('symptom', e.target.value)}
                                placeholder="Describe el problema del vehículo..."
                                rows={3}
                                className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 resize-none ${errors.symptom
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={isCreating}
                            />
                            {errors.symptom && (
                                <p className="mt-1 text-sm text-red-600">{errors.symptom}</p>
                            )}
                        </div>

                        {/* Client Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Nombre del Cliente <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => handleChange('clientName', e.target.value)}
                                placeholder="Juan Pérez"
                                className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 ${errors.clientName
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={isCreating}
                            />
                            {errors.clientName && (
                                <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
                            )}
                        </div>

                        {/* Client Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Teléfono <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.clientPhone}
                                onChange={(e) => handleChange('clientPhone', e.target.value)}
                                placeholder="+34 600 123 456"
                                className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 ${errors.clientPhone
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={isCreating}
                            />
                            {errors.clientPhone && (
                                <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
                            )}
                        </div>

                        {/* Location (Optional) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Ubicación <span className="text-gray-400 text-xs">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="A-1 km 25 dirección Madrid"
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isCreating}
                            />
                        </div>

                        {/* Notes (Optional) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Notas Adicionales <span className="text-gray-400 text-xs">(opcional)</span>
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Notas internas del operador..."
                                rows={2}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                disabled={isCreating}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={isCreating}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isCreating}
                            >
                                {isCreating ? 'Creando...' : 'Crear Caso'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
