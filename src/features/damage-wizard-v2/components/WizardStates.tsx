import { ProgressCard } from './ProgressCard';

/**
 * Componente para mostrar estado de carga
 */
export const LoadingState = () => (
  <ProgressCard
    title="Cargando peritaje"
    description="Estamos preparando la información del peritaje para ti"
    asOverlay={false}
  />
);

/**
 * Componente para mostrar estado de error
 */
export const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mb-4 text-6xl text-red-600">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Error al cargar el peritaje</h2>
      <p className="mb-4 text-gray-600">{error}</p>
      <button
        onClick={onRetry}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  </div>
);

/**
 * Componente para mostrar estado de no encontrado
 */
export const NotFoundState = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mb-4 text-6xl text-gray-600">❓</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Peritaje no encontrado</h2>
      <p className="text-gray-600">No se pudo cargar la información del peritaje.</p>
    </div>
  </div>
);
