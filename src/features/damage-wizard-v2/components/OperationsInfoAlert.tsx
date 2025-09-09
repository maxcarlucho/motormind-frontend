import { AlertTriangle } from 'lucide-react';

export const OperationsInfoAlert = () => {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 text-blue-600" />
      <div>
        <p className="text-sm font-medium text-blue-900">
          Los tiempos se calcularán automáticamente en 'Valoración'
        </p>
        <p className="mt-1 text-sm text-blue-700">
          Aquí solo defines el tipo de operación. Los costes y horas se mostrarán en el siguiente
          paso.
        </p>
      </div>
    </div>
  );
};
