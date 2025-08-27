import { Button } from '@/components/atoms/Button';
import { Check, ArrowRight, Plus, Zap } from 'lucide-react';

interface ConfirmDamagesActionsProps {
  isReadOnly: boolean;
  selectedDamagesCount: number;
  totalDamagesCount: number;
  showOnlyConfident: boolean;
  onAddDamage: () => void;
  onToggleConfidentFilter: () => void;
  onConfirmAll: () => void;
  onConfirmSelected: () => void;
}

export const ConfirmDamagesActions = ({
  isReadOnly,
  selectedDamagesCount,
  totalDamagesCount,
  showOnlyConfident,
  onAddDamage,
  onToggleConfidentFilter,
  onConfirmAll,
  onConfirmSelected,
}: ConfirmDamagesActionsProps) => {
  return (
    <div className="flex w-full items-center justify-between" role="toolbar">
      {/* Left side - Counter */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Check className="h-4 w-4 text-blue-500" />
        {selectedDamagesCount} de {totalDamagesCount} confirmados
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-3">
        {!isReadOnly && (
          <>
            <Button variant="outline" size="sm" onClick={onAddDamage}>
              <Plus className="mr-1 h-4 w-4" />
              Añadir daño
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleConfidentFilter}
              className={showOnlyConfident ? 'border-blue-200 bg-blue-50' : ''}
            >
              <Zap className="mr-1 h-4 w-4" />
              Solo seguros &gt;85%
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmAll}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-1 h-4 w-4" />
              Confirmar Todos
            </Button>
          </>
        )}
        <Button
          onClick={onConfirmSelected}
          disabled={!isReadOnly && selectedDamagesCount === 0}
          size="sm"
        >
          Continuar
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
