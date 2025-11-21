import { useNavigate } from 'react-router-dom';
import { Monitor, Truck, Wrench, Phone, Car, ArrowRight } from 'lucide-react';

/**
 * Landing page for Carretera MVP with quick navigation links
 * This helps with testing and demo purposes
 */
export function CarreteraHome() {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Operador Call Center',
            description: 'Crear nuevos casos y generar enlaces para clientes',
            icon: Phone,
            path: '/operador',
            color: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Cliente',
            description: 'Responder preguntas de diagnóstico en chat',
            icon: Car,
            path: '/carretera/c/test-001',
            color: 'from-green-500 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
        },
        {
            title: 'Gruista',
            description: 'Dashboard móvil para gestión de casos',
            icon: Truck,
            path: '/carretera/g/dashboard',
            color: 'from-orange-500 to-orange-600',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
        },
        {
            title: 'Taller',
            description: 'Recepción de vehículos y gestión de reparaciones',
            icon: Wrench,
            path: '/carretera/t/dashboard',
            color: 'from-purple-500 to-purple-600',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Car className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-bold">Carretera Inteligente</h1>
                    </div>
                    <p className="text-purple-100 text-lg">
                        MVP - Sistema de Asistencia en Carretera con IA
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            Fase 1-5 Completadas
                        </span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            Cliente → Gruista → Taller
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Selecciona un módulo
                    </h2>
                    <p className="text-gray-600">
                        Accede a las diferentes interfaces del sistema
                    </p>
                </div>

                {/* Navigation Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.path}
                                onClick={() => navigate(section.path)}
                                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left relative overflow-hidden active:scale-[0.98]"
                            >
                                {/* Gradient overlay */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                                />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${section.iconBg}`}>
                                            <Icon className={`h-6 w-6 ${section.iconColor}`} />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors mt-3" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {section.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        {section.description}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <span className={`text-sm font-semibold bg-gradient-to-r ${section.color} bg-clip-text text-transparent`}>
                                            Abrir módulo →
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Test Scenarios */}
                <div className="mt-12 bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Escenarios de Prueba Rápida
                    </h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-semibold text-gray-900 mb-1">
                                Flujo completo Cliente → Gruista → Taller
                            </p>
                            <ol className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>1. Operador crea caso en <span className="font-mono text-xs bg-gray-200 px-1 rounded">/operador</span></li>
                                <li>2. Cliente responde preguntas en el chat</li>
                                <li>3. Gruista evalúa y decide remolcar</li>
                                <li>4. Taller acepta el caso y actualiza estado</li>
                            </ol>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="font-semibold text-gray-900 mb-1">
                                URLs de prueba directas
                            </p>
                            <div className="text-sm font-mono space-y-1">
                                <p>• Cliente: /carretera/c/test-001</p>
                                <p>• Gruista caso: /carretera/g/case-001</p>
                                <p>• Taller caso: /carretera/t/workshop-case-001</p>
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="font-semibold text-gray-900 mb-1">
                                Estados de reparación disponibles
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-white rounded">⏳ Inspección pendiente</span>
                                <span className="text-xs px-2 py-1 bg-white rounded">🔍 Inspeccionando</span>
                                <span className="text-xs px-2 py-1 bg-white rounded">📦 Esperando repuestos</span>
                                <span className="text-xs px-2 py-1 bg-white rounded">🔧 Reparando</span>
                                <span className="text-xs px-2 py-1 bg-white rounded">✅ Probando</span>
                                <span className="text-xs px-2 py-1 bg-white rounded">🎉 Completado</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-gray-500">
                    <p>MVP Carretera Inteligente - Motormind</p>
                    <p className="mt-1">Fases 0-5 implementadas</p>
                </div>
            </div>
        </div>
    );
}