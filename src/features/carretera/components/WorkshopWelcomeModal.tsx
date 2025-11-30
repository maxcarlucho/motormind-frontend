import { useState, useEffect } from 'react';
import { X, Car, Truck, Wrench, ArrowRight, Clock, Zap } from 'lucide-react';

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
 * Welcome modal for workshop technicians receiving a roadside case
 * Written for someone who has NO IDEA what this system is
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
                    className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header - Explain WHAT this is */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 px-6 py-8 text-white text-center rounded-t-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                        <Truck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Te llega un coche de grúa</h2>
                    <p className="text-orange-100 text-sm">
                        Un vehículo tuvo una avería en carretera y viene hacia tu taller
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* The car that's coming */}
                    <div className="bg-slate-800 text-white rounded-xl p-4">
                        <div className="flex items-center gap-4">
                            <Car className="h-12 w-12 text-slate-400" />
                            <div>
                                <p className="text-3xl font-bold font-mono tracking-wider">{vehiclePlate}</p>
                                <p className="text-slate-400 text-sm">Cliente: {clientName}</p>
                            </div>
                        </div>
                    </div>

                    {/* What's wrong with it */}
                    <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                            Problema reportado
                        </p>
                        <p className="text-amber-900 font-medium">{symptom}</p>
                    </div>

                    {/* Why couldn't they fix it there */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            ¿Por qué viene a tu taller?
                        </p>
                        <p className="text-gray-700 text-sm">
                            {gruistaDecision === 'repair-failed'
                                ? 'La grúa intentó repararlo en carretera pero el problema requiere herramientas o piezas de taller.'
                                : 'La avería no se puede resolver en carretera. Necesita diagnóstico y reparación profesional.'}
                        </p>
                    </div>

                    {/* What YOU need to do - THE VALUE PROP */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-green-800 mb-1">
                                    ¿Qué tienes que hacer?
                                </p>
                                <p className="text-green-700 text-sm mb-3">
                                    Conecta tu escáner OBD al coche cuando llegue. Mete los códigos de error aquí y el sistema te dará un diagnóstico automático con las posibles averías.
                                </p>
                                <div className="flex items-center gap-2 text-green-600 text-xs">
                                    <Clock className="h-4 w-4" />
                                    <span>Te ahorra tiempo buscando el problema</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple steps */}
                    <div className="flex items-center justify-between text-center text-xs text-gray-500">
                        <div className="flex-1">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-1 font-bold">1</div>
                            <p>Revisa<br/>la info</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                        <div className="flex-1">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-1 font-bold">2</div>
                            <p>Acepta<br/>el caso</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                        <div className="flex-1">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-1 font-bold">3</div>
                            <p>Mete<br/>códigos OBD</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                        <div className="flex-1">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-1 font-bold">✓</div>
                            <p>Diagnóstico<br/>automático</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 space-y-3">
                    <button
                        onClick={handleAccept}
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Wrench className="h-5 w-5" />
                        <span>Ver Info del Coche</span>
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                        Caso #{caseNumber}
                    </p>
                </div>
            </div>
        </div>
    );
}
