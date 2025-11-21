import { X, Copy, MessageCircle, ExternalLink } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { OperatorCase } from '../types/carretera.types';
import { CaseStatusBadge } from './CaseStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseDetailModalProps {
    caseData: OperatorCase;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal to display detailed information about a case
 * Phase 1: Basic information and actions
 */
export function CaseDetailModal({ caseData, isOpen, onClose }: CaseDetailModalProps) {
    if (!isOpen) return null;

    const copyClientLink = async () => {
        const link = `${window.location.origin}/carretera/c/${caseData.id}`;

        try {
            await navigator.clipboard.writeText(link);
            enqueueSnackbar('✅ Link copiado al portapapeles', { variant: 'success' });
        } catch (err) {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = link;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            enqueueSnackbar('✅ Link copiado', { variant: 'success' });
        }
    };

    const sendToWhatsApp = () => {
        const { clientPhone, clientName, symptom, id } = caseData;
        const clientLink = `${window.location.origin}/carretera/c/${id}`;

        const message = encodeURIComponent(
            `Hola ${clientName},\n\n` +
            `Para asistirte con "${symptom}", ` +
            `accede a este enlace y responde las preguntas:\n\n` +
            `${clientLink}\n\n` +
            `Muchas gracias,\n` +
            `Asistencia en Carretera Mapfre`
        );

        const phone = clientPhone.replace(/\D/g, ''); // Remove non-digits
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

        window.open(whatsappUrl, '_blank');
    };

    const openClientView = () => {
        window.open(`/carretera/c/${caseData.id}`, '_blank');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div
                        className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-gray-200">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Caso {caseData.caseNumber}
                                    </h2>
                                    <CaseStatusBadge status={caseData.status} />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Matrícula: <span className="font-semibold">{caseData.vehiclePlate}</span>
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Client Information */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                                    Información del Cliente
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Nombre</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {caseData.clientName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {caseData.clientPhone}
                                        </p>
                                    </div>
                                </div>
                                {caseData.location && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                                        <p className="text-sm text-gray-900">{caseData.location}</p>
                                    </div>
                                )}
                            </div>

                            {/* Case Details */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                                    Detalles del Caso
                                </h3>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Síntoma Reportado</p>
                                    <p className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg p-3">
                                        {caseData.symptom}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Creado</p>
                                        <p className="text-sm text-gray-900">
                                            {formatDistanceToNow(caseData.createdAt, {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Última actualización</p>
                                        <p className="text-sm text-gray-900">
                                            {formatDistanceToNow(caseData.updatedAt, {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Client Link */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-blue-900 mb-2">
                                    ENLACE DEL CLIENTE
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={caseData.clientLink}
                                        className="flex-1 text-xs font-mono bg-white border border-blue-300 rounded px-3 py-2 text-gray-700"
                                    />
                                    <button
                                        onClick={copyClientLink}
                                        className="p-2 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                        title="Copiar link"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={openClientView}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Abrir Vista del Cliente
                            </button>
                            <button
                                onClick={sendToWhatsApp}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Enviar por WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
