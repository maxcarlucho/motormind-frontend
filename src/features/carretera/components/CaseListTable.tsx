import { useState } from 'react';
import { Copy, MessageCircle, Loader2, Eye, CheckCircle } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { OperatorCase } from '../types/carretera.types';
import { CaseStatusBadge } from './CaseStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPublicClientUrl } from '../constants/publicUrl';

interface CaseListTableProps {
    cases: OperatorCase[];
    isLoading: boolean;
    onCaseClick?: (caseData: OperatorCase) => void;
}

// Track which cases have had WhatsApp sent recently
type SentStatus = { [caseId: string]: boolean };

/**
 * Helper to format phone number for WhatsApp
 * Ensures Spanish numbers have +34 prefix
 */
function formatPhoneForWhatsApp(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits

    // If already has country code (starts with 34), keep it
    if (cleanPhone.startsWith('34') && cleanPhone.length >= 11) {
        return cleanPhone;
    }

    // Spanish mobile numbers start with 6, 7, 8, or 9
    if (cleanPhone.length === 9 && /^[6789]/.test(cleanPhone)) {
        return `34${cleanPhone}`;
    }

    return cleanPhone;
}

/**
 * Table component displaying list of operator cases
 * Responsive: Table on desktop, cards on mobile
 */
export function CaseListTable({ cases, isLoading, onCaseClick }: CaseListTableProps) {
    const [whatsappSent, setWhatsappSent] = useState<SentStatus>({});

    const copyClientLink = async (operatorCase: OperatorCase) => {
        // Use pre-generated clientLink with secure token, or fallback
        const basePath = operatorCase.clientLink || `/carretera/c/${operatorCase.id}`;
        const link = getPublicClientUrl(basePath);

        try {
            await navigator.clipboard.writeText(link);
            enqueueSnackbar('Link copiado al portapapeles', { variant: 'success' });
        } catch (err) {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = link;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            enqueueSnackbar('Link copiado', { variant: 'success' });
        }
    };

    const sendToWhatsApp = (operatorCase: OperatorCase) => {
        const { clientPhone, clientName, symptom, id } = operatorCase;
        // Use pre-generated clientLink with secure token, always with public URL
        const basePath = operatorCase.clientLink || `/carretera/c/${id}`;
        const clientLink = getPublicClientUrl(basePath);

        const message = encodeURIComponent(
            `Hola ${clientName},\n\n` +
            `Para asistirte con "${symptom}", ` +
            `accede a este enlace y responde las preguntas:\n\n` +
            `${clientLink}\n\n` +
            `Muchas gracias,\n` +
            `Asistencia en Carretera`
        );

        const phone = formatPhoneForWhatsApp(clientPhone);
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

        window.open(whatsappUrl, '_blank');

        // Mark as sent and show feedback
        setWhatsappSent(prev => ({ ...prev, [id]: true }));
        enqueueSnackbar(`WhatsApp enviado a ${clientName}`, { variant: 'success' });

        // Reset after 30 seconds
        setTimeout(() => {
            setWhatsappSent(prev => ({ ...prev, [id]: false }));
        }, 30000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (cases.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay casos creados aún
                </h3>
                <p className="text-gray-600 mb-4">
                    Crea tu primer caso para comenzar a ayudar a los clientes
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Matrícula
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Cliente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Teléfono
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Síntoma
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Creado
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {cases.map((operatorCase) => (
                            <tr
                                key={operatorCase.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => onCaseClick?.(operatorCase)}
                            >
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                    {operatorCase.caseNumber}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {operatorCase.vehiclePlate}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    {operatorCase.clientName}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {operatorCase.clientPhone}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                    {operatorCase.symptom}
                                </td>
                                <td className="px-4 py-3">
                                    <CaseStatusBadge status={operatorCase.status} />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {formatDistanceToNow(operatorCase.createdAt, {
                                        addSuffix: true,
                                        locale: es,
                                    })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCaseClick?.(operatorCase);
                                            }}
                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                            title="Ver detalles"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyClientLink(operatorCase);
                                            }}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Copiar link del cliente"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                sendToWhatsApp(operatorCase);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${
                                                whatsappSent[operatorCase.id]
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white'
                                            }`}
                                            title={whatsappSent[operatorCase.id] ? 'WhatsApp enviado' : 'Enviar por WhatsApp'}
                                        >
                                            {whatsappSent[operatorCase.id] ? (
                                                <CheckCircle className="h-5 w-5" />
                                            ) : (
                                                <MessageCircle className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {cases.map((operatorCase) => (
                    <div
                        key={operatorCase.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onCaseClick?.(operatorCase)}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-500">
                                        {operatorCase.caseNumber}
                                    </span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {operatorCase.vehiclePlate}
                                    </span>
                                </div>
                                <CaseStatusBadge status={operatorCase.status} />
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">
                                {operatorCase.clientName}
                            </div>
                            <div className="text-sm text-gray-600">{operatorCase.clientPhone}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                                {operatorCase.symptom}
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-gray-500">
                            Creado{' '}
                            {formatDistanceToNow(operatorCase.createdAt, {
                                addSuffix: true,
                                locale: es,
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-2">
                            {/* WhatsApp - Primary action */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    sendToWhatsApp(operatorCase);
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-white rounded-lg transition-colors ${
                                    whatsappSent[operatorCase.id]
                                        ? 'bg-green-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {whatsappSent[operatorCase.id] ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        WhatsApp Enviado
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="h-5 w-5" />
                                        Enviar WhatsApp
                                    </>
                                )}
                            </button>
                            {/* Secondary actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCaseClick?.(operatorCase);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    <Eye className="h-4 w-4" />
                                    Ver
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyClientLink(operatorCase);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Copy className="h-4 w-4" />
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
