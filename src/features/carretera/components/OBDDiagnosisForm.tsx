import { useState } from 'react';
import { Stethoscope, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface OBDDiagnosisFormProps {
    onSubmit: (obdCodes: string[], comments: string) => Promise<void>;
    isProcessing: boolean;
    caseNumber: string;
    vehiclePlate: string;
    symptom: string;
}

/**
 * Form to capture OBD codes and technician comments for diagnosis regeneration
 * This component is used after accepting a case in the workshop flow
 */
export function OBDDiagnosisForm({
    onSubmit,
    isProcessing,
    caseNumber,
    vehiclePlate,
    symptom
}: OBDDiagnosisFormProps) {
    const [obdCodes, setObdCodes] = useState<string>('');
    const [comments, setComments] = useState('');
    const [errors, setErrors] = useState<{ obdCodes?: string; comments?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Parse and validate OBD codes
        const codes = obdCodes
            .split(/[\s,;]+/)
            .map(code => code.trim().toUpperCase())
            .filter(code => code.length > 0);

        // Validation
        const newErrors: typeof errors = {};

        if (codes.length === 0) {
            newErrors.obdCodes = 'Por favor, ingresa al menos un código OBD';
        }

        // Validate OBD code format (P/B/C/U followed by 4 digits)
        const invalidCodes = codes.filter(code => !isValidOBDCode(code));
        if (invalidCodes.length > 0) {
            newErrors.obdCodes = `Códigos inválidos: ${invalidCodes.join(', ')}. Formato: letra (P/B/C/U) + 4 dígitos`;
        }

        if (!comments.trim()) {
            newErrors.comments = 'Por favor, añade observaciones de la inspección';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Submit valid data
        await onSubmit(codes, comments.trim());
    };

    const isValidOBDCode = (code: string): boolean => {
        // OBD-II format: P/B/C/U followed by 4 digits/letters
        return /^[PBCU][0-9A-F]{4}$/i.test(code);
    };

    const formatOBDCodes = (value: string) => {
        // Auto-uppercase as user types
        const formatted = value.toUpperCase();
        setObdCodes(formatted);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                    <Stethoscope className="h-6 w-6" />
                    <div>
                        <h2 className="text-xl font-bold">Diagnóstico Profesional</h2>
                        <p className="text-sm text-indigo-100">Caso {caseNumber} - {vehiclePlate}</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Context */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Síntoma reportado:</p>
                    <p className="text-sm text-gray-600 italic">"{symptom}"</p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Proceso de diagnóstico:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>Conecta el escáner OBD-II al vehículo</li>
                                <li>Lee y anota todos los códigos de error</li>
                                <li>Realiza una inspección visual del vehículo</li>
                                <li>Documenta tus observaciones detalladamente</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* OBD Codes Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Códigos OBD-II detectados <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={obdCodes}
                            onChange={(e) => formatOBDCodes(e.target.value)}
                            placeholder="Ej: P0171, P0300, C0035"
                            disabled={isProcessing}
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-lg ${
                                errors.obdCodes ? 'border-red-400' : 'border-gray-300'
                            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        />
                        {obdCodes && obdCodes.length > 0 && !errors.obdCodes && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                        )}
                    </div>
                    {errors.obdCodes && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.obdCodes}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        Separa múltiples códigos con comas, espacios o punto y coma
                    </p>
                </div>

                {/* Comments Textarea */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Observaciones del técnico <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Describe detalladamente lo observado durante la inspección:&#10;• Estado de componentes visibles&#10;• Ruidos o comportamientos anormales&#10;• Fugas o manchas detectadas&#10;• Olores inusuales&#10;• Estado de fluidos&#10;• Cualquier otra observación relevante"
                        disabled={isProcessing}
                        rows={6}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.comments ? 'border-red-400' : 'border-gray-300'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {errors.comments && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.comments}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        Mínimo 20 caracteres. Sé específico y detallado en tus observaciones.
                    </p>
                </div>

                {/* Common OBD Codes Reference */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Referencia rápida - Códigos comunes:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">P0171/P0174</span>
                                <span className="text-gray-600">Mezcla pobre</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">P0300-P0308</span>
                                <span className="text-gray-600">Fallos de encendido</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">P0420/P0430</span>
                                <span className="text-gray-600">Catalizador</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">P0401</span>
                                <span className="text-gray-600">EGR insuficiente</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">P0128</span>
                                <span className="text-gray-600">Termostato</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">P0442/P0455</span>
                                <span className="text-gray-600">Fuga EVAP</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">C0035-C0040</span>
                                <span className="text-gray-600">Sensores ABS</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold text-indigo-600">B1234</span>
                                <span className="text-gray-600">Airbag</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Generando diagnóstico completo...</span>
                        </>
                    ) : (
                        <>
                            <FileText className="h-6 w-6" />
                            <span>Generar Diagnóstico Completo</span>
                        </>
                    )}
                </button>

                {/* Info note */}
                {isProcessing ? (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-indigo-600 font-medium">
                            La IA está analizando los códigos OBD y generando el diagnóstico...
                        </p>
                        <p className="text-xs text-gray-500">
                            Este proceso puede tardar entre 1-2 minutos. Por favor, no cierres esta ventana.
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-center text-gray-500">
                        El sistema combinará los códigos OBD, tus observaciones y las respuestas del cliente para generar un diagnóstico preciso.
                    </p>
                )}
            </form>
        </div>
    );
}

