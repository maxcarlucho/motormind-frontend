import { useState } from 'react';
import { Cpu, FileText, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, MessageSquare, Brain, User, Wrench } from 'lucide-react';
import { AIAssessment } from '../types/carretera.types';

interface OBDDiagnosisFormProps {
    onSubmit: (obdCodes: string[], comments: string) => Promise<void>;
    isProcessing: boolean;
    caseNumber: string;
    vehiclePlate: string;
    symptom: string;
    // Nuevo: contexto completo para el técnico
    clientName?: string;
    questions?: string[];
    answers?: string[];
    aiAssessment?: AIAssessment;
}

/**
 * Formulario de diagnóstico OBD rediseñado con UX profesional
 * Incluye todo el contexto del caso para que el técnico tome decisiones informadas
 */
export function OBDDiagnosisForm({
    onSubmit,
    isProcessing,
    caseNumber,
    vehiclePlate,
    symptom,
    clientName,
    questions = [],
    answers = [],
    aiAssessment
}: OBDDiagnosisFormProps) {
    const [obdCodes, setObdCodes] = useState<string>('');
    const [comments, setComments] = useState('');
    const [errors, setErrors] = useState<{ obdCodes?: string; comments?: string }>({});
    const [showClientQA, setShowClientQA] = useState(false);

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
            newErrors.obdCodes = 'Ingresa al menos un código OBD';
        }

        // Validate OBD code format (P/B/C/U followed by 4 digits)
        const invalidCodes = codes.filter(code => !isValidOBDCode(code));
        if (invalidCodes.length > 0) {
            newErrors.obdCodes = `Formato inválido: ${invalidCodes.join(', ')}`;
        }

        if (!comments.trim() || comments.trim().length < 10) {
            newErrors.comments = 'Añade observaciones (mín. 10 caracteres)';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        await onSubmit(codes, comments.trim());
    };

    const isValidOBDCode = (code: string): boolean => {
        return /^[PBCU][0-9A-F]{4}$/i.test(code);
    };

    // Limpiar síntoma de tags internos
    const cleanSymptom = symptom?.split('[ASISTENCIA')[0]?.trim() || symptom;

    // Determinar color de recomendación
    const getRecommendationStyle = () => {
        if (!aiAssessment) return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '⚪' };
        switch (aiAssessment.recommendation) {
            case 'repair':
                return { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢', label: 'Reparable in-situ' };
            case 'tow':
            default:
                return { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'Requiere taller' };
        }
    };

    const recStyle = getRecommendationStyle();

    return (
        <div className="space-y-4">
            {/* SECCIÓN 1: Contexto del caso - Lo más importante arriba */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header con matrícula y caso */}
                <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Cpu className="h-5 w-5 text-slate-400" />
                        <div>
                            <span className="text-white font-bold">{vehiclePlate}</span>
                            <span className="text-slate-400 text-sm ml-2">• {caseNumber}</span>
                        </div>
                    </div>
                    {clientName && (
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {clientName.split(' ')[0]}
                        </span>
                    )}
                </div>

                {/* Problema reportado - Destacado */}
                <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Problema</p>
                    <p className="text-gray-900 font-medium">{cleanSymptom}</p>
                </div>

                {/* Pre-diagnóstico IA - Si existe */}
                {aiAssessment && aiAssessment.status === 'ready' && (
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Brain className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase">Pre-diagnóstico IA</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${recStyle.bg} ${recStyle.text} font-medium`}>
                                        {recStyle.icon} {recStyle.label}
                                    </span>
                                    {aiAssessment.confidence && (
                                        <span className="text-xs text-gray-500">{aiAssessment.confidence}% confianza</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-800 font-medium">{aiAssessment.diagnosis}</p>

                                {/* Razones resumidas */}
                                {aiAssessment.reasoning && aiAssessment.reasoning.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-600">
                                        {aiAssessment.reasoning.slice(0, 2).map((reason, idx) => {
                                            // Extraer primera oración corta
                                            const short = reason.split('.')[0];
                                            if (short.length > 80) return null;
                                            return (
                                                <span key={idx} className="inline-block mr-2">
                                                    • {short}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Respuestas del cliente - Colapsable */}
                {questions.length > 0 && answers.length > 0 && (
                    <div className="border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setShowClientQA(!showClientQA)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MessageSquare className="h-4 w-4" />
                                <span>Respuestas del cliente ({answers.length})</span>
                            </div>
                            {showClientQA ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                        </button>

                        {showClientQA && (
                            <div className="px-4 pb-4 space-y-3">
                                {questions.map((question, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">P: {question}</p>
                                        <p className="text-sm text-gray-800 font-medium">
                                            R: {answers[idx] || <span className="text-gray-400 italic">Sin respuesta</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: Formulario OBD - Compacto y directo */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border-2 border-indigo-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                    <div className="flex items-center gap-2 text-white">
                        <Wrench className="h-5 w-5" />
                        <span className="font-bold">Tu diagnóstico</span>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Input de códigos OBD - Grande y claro */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Códigos OBD-II <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={obdCodes}
                            onChange={(e) => setObdCodes(e.target.value.toUpperCase())}
                            placeholder="P0171, P0300, C0035..."
                            disabled={isProcessing}
                            className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xl tracking-wider ${
                                errors.obdCodes ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            } disabled:bg-gray-100`}
                        />
                        {errors.obdCodes ? (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.obdCodes}
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                Separa con comas o espacios. Formato: P0000, B0000, C0000, U0000
                            </p>
                        )}
                    </div>

                    {/* Observaciones - Más compacto */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Observaciones <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Qué has visto, oído u olido durante la inspección..."
                            disabled={isProcessing}
                            rows={3}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                                errors.comments ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            } disabled:bg-gray-100`}
                        />
                        {errors.comments && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.comments}
                            </p>
                        )}
                    </div>

                    {/* Botón de envío */}
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>Analizando...</span>
                            </>
                        ) : (
                            <>
                                <FileText className="h-6 w-6" />
                                <span>Generar Diagnóstico</span>
                            </>
                        )}
                    </button>

                    {isProcessing && (
                        <p className="text-xs text-center text-indigo-600">
                            La IA combina los códigos OBD con el pre-diagnóstico para darte un resultado preciso
                        </p>
                    )}
                </div>
            </form>

            {/* Referencia rápida OBD - Colapsada por defecto */}
            <details className="bg-gray-50 rounded-xl border border-gray-200">
                <summary className="px-4 py-3 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    📖 Referencia rápida de códigos OBD
                </summary>
                <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                        <div className="flex justify-between"><span className="font-mono font-bold">P0171/P0174</span><span>Mezcla pobre</span></div>
                        <div className="flex justify-between"><span className="font-mono font-bold">P0300-P0308</span><span>Fallos encendido</span></div>
                        <div className="flex justify-between"><span className="font-mono font-bold">P0420</span><span>Catalizador</span></div>
                        <div className="flex justify-between"><span className="font-mono font-bold">P0401</span><span>EGR</span></div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between"><span className="font-mono font-bold">P0128</span><span>Termostato</span></div>
                        <div className="flex justify-between"><span className="font-mono font-bold">P0442</span><span>Fuga EVAP</span></div>
                        <div className="flex justify-between"><span className="font-mono font-bold">C0035</span><span>Sensor ABS</span></div>
                        <div className="flex justify-between"><span className="font-mono font-bold">B1234</span><span>Airbag</span></div>
                    </div>
                </div>
            </details>
        </div>
    );
}
