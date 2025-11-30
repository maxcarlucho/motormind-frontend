import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, MessageCircle, Truck, ExternalLink } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';

interface WorkshopLinkModalProps {
    isOpen: boolean;
    workshopLink: string;
    vehiclePlate: string;
    symptom: string;
    onClose: () => void;
}

/**
 * Modal that shows the workshop link after gruista decides to tow
 * Easy to copy and share via WhatsApp
 */
export function WorkshopLinkModal({
    isOpen,
    workshopLink,
    vehiclePlate,
    symptom,
    onClose,
}: WorkshopLinkModalProps) {
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setCopied(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(workshopLink);
            setCopied(true);
            enqueueSnackbar('Link copiado', { variant: 'success' });
            setTimeout(() => setCopied(false), 3000);
        } catch (err) {
            // Fallback
            const input = document.createElement('input');
            input.value = workshopLink;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            enqueueSnackbar('Link copiado', { variant: 'success' });
        }
    };

    const sendWhatsApp = () => {
        const message = encodeURIComponent(
            `🔴 VEHÍCULO PARA TALLER\n\n` +
            `Matrícula: ${vehiclePlate}\n` +
            `Problema: ${symptom}\n\n` +
            `Accede aquí para ver el caso y meter los códigos OBD:\n` +
            `${workshopLink}`
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const openLink = () => {
        window.open(workshopLink, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

            {/* Modal */}
            <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-transform duration-200 ${isVisible ? 'scale-100' : 'scale-95'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Remolcar al Taller</h2>
                            <p className="text-red-100 text-sm">{vehiclePlate}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-sm">
                        Envía este link al taller para que puedan recibir el vehículo y completar el diagnóstico:
                    </p>

                    {/* Link Box */}
                    <div className="bg-gray-100 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Link del taller</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={workshopLink}
                                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                                onClick={copyLink}
                                className={`p-3 rounded-lg transition-all ${
                                    copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Copy - Primary */}
                        <button
                            onClick={copyLink}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                                copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="h-6 w-6" />
                                    Copiado
                                </>
                            ) : (
                                <>
                                    <Copy className="h-6 w-6" />
                                    Copiar Link
                                </>
                            )}
                        </button>

                        {/* WhatsApp */}
                        <button
                            onClick={sendWhatsApp}
                            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors"
                        >
                            <MessageCircle className="h-6 w-6" />
                            Enviar por WhatsApp
                        </button>

                        {/* Open Link */}
                        <button
                            onClick={openLink}
                            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Ver como taller
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                    <button
                        onClick={handleClose}
                        className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                        Cerrar y volver al dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
