import { CheckCircle, Truck, MapPin } from 'lucide-react';

interface ClientCompleteProps {
    clientName?: string;
    estimatedArrival?: Date;
}

export function ClientComplete({
    clientName = 'Cliente',
    estimatedArrival,
}: ClientCompleteProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
            <div className="w-full max-w-md space-y-6 text-center">
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-6">
                        <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                </div>

                {/* Main Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        ¡Gracias, {clientName}!
                    </h1>
                    <p className="text-lg text-gray-600">
                        Hemos recibido toda la información
                    </p>
                </div>

                {/* Tow Truck Status */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Truck className="h-8 w-8 text-blue-600" />
                        <h2 className="text-xl font-semibold text-blue-900">
                            La grúa está en camino
                        </h2>
                    </div>

                    {estimatedArrival && (
                        <div className="flex items-center justify-center gap-2 text-blue-700">
                            <MapPin className="h-5 w-5" />
                            <p className="text-base">
                                Llegada estimada:{' '}
                                <span className="font-semibold">
                                    {estimatedArrival.toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="rounded-lg bg-gray-50 p-6 text-left">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Mientras esperas:
                    </h3>
                    <ul className="space-y-2 text-base text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>Permanece en un lugar seguro cerca del vehículo</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>Ten a mano la documentación del vehículo</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>El gruista te contactará cuando esté cerca</span>
                        </li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Servicio de asistencia en carretera
                    </p>
                </div>
            </div>
        </div>
    );
}
