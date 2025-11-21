import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { WorkshopRejectionReason } from '../types/carretera.types';

interface WorkshopActionsProps {
    onAccept: () => Promise<void>;
    onReject: (reason: WorkshopRejectionReason, notes?: string) => Promise<void>;
    isProcessing: boolean;
}

/**
 * Accept/Reject action buttons for workshop case reception
 */
export function WorkshopActions({ onAccept, onReject, isProcessing }: WorkshopActionsProps) {
    const [showAcceptDialog, setShowAcceptDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState<WorkshopRejectionReason>('no-capacity');
    const [rejectNotes, setRejectNotes] = useState('');

    const handleAccept = async () => {
        await onAccept();
        setShowAcceptDialog(false);
    };

    const handleReject = async () => {
        if (!rejectReason) return;
        await onReject(rejectReason, rejectNotes || undefined);
        setShowRejectDialog(false);
        setRejectNotes('');
    };

    const reasonOptions: Array<{ value: WorkshopRejectionReason; label: string }> = [
        { value: 'no-capacity', label: 'Taller lleno - Sin capacidad' },
        { value: 'no-parts', label: 'No tenemos los repuestos necesarios' },
        { value: 'wrong-specialty', label: 'Requiere especialidad diferente' },
        { value: 'other', label: 'Otra razón (especificar abajo)' },
    ];

    return (
        <div className="space-y-3">
            {/* Accept Button */}
            <button
                onClick={() => setShowAcceptDialog(true)}
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                <Check className="h-6 w-6" />
                <span>ACEPTAR CASO</span>
            </button>

            {/* Reject Button */}
            <button
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="w-full py-3 px-6 border-2 border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <X className="h-5 w-5" />
                <span>Rechazar Caso</span>
            </button>

            {/* Accept Confirmation Dialog */}
            {showAcceptDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Recepción</h3>
                            <p className="text-gray-600">
                                ¿Confirmas que el vehículo ha llegado al taller y puedes atender este caso?
                            </p>
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    ℹ️ Se generará una orden de servicio automáticamente
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAcceptDialog(false)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
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

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div>
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <X className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                                Rechazar Caso
                            </h3>
                            <p className="text-gray-600 text-center mb-4">
                                Por favor, especifica el motivo del rechazo:
                            </p>
                        </div>

                        {/* Reason Selector */}
                        <div className="space-y-2">
                            {reasonOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="rejectReason"
                                        value={option.value}
                                        checked={rejectReason === option.value}
                                        onChange={(e) => setRejectReason(e.target.value as WorkshopRejectionReason)}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Notes Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Notas adicionales {rejectReason === 'other' && '(obligatorio)'}
                            </label>
                            <textarea
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Detalles adicionales sobre el rechazo..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px] text-base"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectDialog(false);
                                    setRejectNotes('');
                                }}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isProcessing || (rejectReason === 'other' && !rejectNotes.trim())}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    'Confirmar Rechazo'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
