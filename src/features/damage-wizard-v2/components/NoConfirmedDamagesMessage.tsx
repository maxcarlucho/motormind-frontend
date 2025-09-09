import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

interface NoConfirmedDamagesMessageProps {
  onGoBack: () => void;
}

export const NoConfirmedDamagesMessage = ({ onGoBack }: NoConfirmedDamagesMessageProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay daños confirmados</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron daños confirmados para definir operaciones.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={onGoBack}>
            Volver a Daños
          </Button>
        </div>
      </div>
    </div>
  );
};
