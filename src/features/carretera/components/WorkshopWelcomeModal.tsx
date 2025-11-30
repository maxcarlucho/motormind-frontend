import { useState, useEffect } from 'react';
import { X, Car, Brain, Wrench, ClipboardCheck, ArrowRight, Cpu } from 'lucide-react';

interface WorkshopWelcomeModalProps {
    caseNumber: string;
    vehiclePlate: string;
    symptom: string;
    clientName: string;
    gruistaDecision: 'repair' | 'tow' | 'repair-failed';
    onClose: () => void;
    onAccept: () => void;
}

/**
 * Welcome modal that provides context to the workshop technician
 * when they first open a case from roadside assistance
 */
export function WorkshopWelcomeModal({
    caseNumber,
    vehiclePlate,
    symptom,
    clientName,
    gruistaDecision,
    onClose,
    onAccept,
}: WorkshopWelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 50);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    const handleAccept = () => {
        setIsVisible(false);
        setTimeout(onAccept, 200);
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-transform duration-200 ${isVisible ? 'scale-100' : 'scale-95'}`}>
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white text-center rounded-t-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                        <Wrench className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Nuevo Caso de Carretera</h2>
                    <p className="text-purple-100">Caso {caseNumber}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Vehicle Quick Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <Car className="h-10 w-10 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{vehiclePlate}</p>
                                <p className="text-sm text-gray-600">Cliente: {clientName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Symptom */}
                    <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-lg">
                        <p className="text-sm font-semibold text-amber-800 mb-1">Síntoma reportado:</p>
                        <p className="text-amber-900">{symptom}</p>
                    </div>

                    {/* Why it's here */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-red-800 mb-2">
                            Motivo del remolque:
                        </p>
                        <p className="text-red-700">
                            {gruistaDecision === 'repair-failed'
                                ? 'El gruista intentó reparar en carretera pero no fue posible resolver el problema in-situ.'
                                : 'El diagnóstico IA determinó que este vehículo requiere reparación en taller.'}
                        </p>
                    </div>

                    {/* What to expect - Process Steps */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Lo que encontrarás en este caso:</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Evaluación del cliente</p>
                                    <p className="text-sm text-gray-600">Preguntas y respuestas del cliente en carretera</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Brain className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Pre-diagnóstico IA</p>
                                    <p className="text-sm text-gray-600">Análisis preliminar generado por inteligencia artificial</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Cpu className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Diagnóstico OBD completo</p>
                                    <p className="text-sm text-gray-600">Podrás añadir códigos OBD para un diagnóstico preciso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-3">
                    <button
                        onClick={handleAccept}
                        className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <span>Ver Detalles del Caso</span>
                        <ArrowRight className="h-5 w-5" />
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                        Revisa toda la información antes de aceptar o rechazar el caso
                    </p>
                </div>
            </div>
        </div>
    );
}
