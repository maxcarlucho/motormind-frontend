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
    <div
      className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between"
      role="toolbar"
    >
      {/* Left side - Counter */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Check className="h-4 w-4 text-blue-500" />
        {selectedDamagesCount} de {totalDamagesCount} confirmados
      </div>

      {/* Right side - Action buttons */}
      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
        {!isReadOnly && (
          <>
            <Button variant="outline" size="sm" onClick={onAddDamage} className="w-full md:w-auto">
              <Plus className="mr-1 h-4 w-4" />
              Añadir daño
            </Button>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={onToggleConfidentFilter}
              className={`w-full md:w-auto ${showOnlyConfident ? 'border-blue-200 bg-blue-50' : ''}`}
            >
              <Zap className="mr-1 h-4 w-4" />
              Solo seguros &gt;85%
            </Button> */}
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmAll}
              className="w-full bg-green-600 hover:bg-green-700 md:w-auto"
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
          className="w-full md:w-auto"
        >
          Continuar
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
