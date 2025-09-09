import { Dropdown } from '@/components/atoms/Dropdown';
import { Badge } from '@/components/atoms/Badge';
import { getDamageTypeLabel } from '@/types/DamageAssessment';
import { Damage, operationLabels, severityColors, severityLabels } from '@/types/DamageAssessment';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { DamageAction } from '@/types/DamageAssessment';

interface RecommendedOperationCardProps {
  damage: Damage;
  proposedOperation: DamageAction;
  onUpdateOperation: (damageId: string, newOperation: DamageAction) => void;
  relatedDamage?: Damage;
  disabled?: boolean;
  hideTitle?: boolean;
}

export const RecommendedOperationCard: React.FC<RecommendedOperationCardProps> = ({
  damage,
  onUpdateOperation,
  disabled = false,
  hideTitle = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!damage) {
    console.error('❌ RecommendedOperationCard: damageType es undefined', damage);
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <div className="text-red-600">
          <h3 className="mb-2 text-lg font-semibold">Error en operación</h3>
          <p className="text-sm">No se pudo cargar la información de la operación para este daño</p>
        </div>
      </div>
    );
  }

  const handleOperationChange = (newOperation: DamageAction) => {
    if (disabled) return;
    onUpdateOperation(damage._id || '', newOperation);
    setIsOpen(false);
  };

  return (
    <div
      className={`rounded-lg border bg-white p-6 shadow-sm ${
        disabled ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200'
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          {!hideTitle && (
            <h3 className="mb-1 text-lg font-semibold text-gray-900">{damage.partLabel}</h3>
          )}

          {damage.type && (
            <div className="flex items-center">
              <span className="text-muted mr-2 text-sm capitalize">
                {getDamageTypeLabel(damage.type)}
              </span>
              <span
                className={`ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${severityColors[damage.severity]}`}
              >
                {severityLabels[damage.severity]}
              </span>
            </div>
          )}

          {disabled && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs text-gray-500">
                Bloqueado por sustitución de pieza
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Operación recomendada
          </label>
          <Dropdown.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dropdown.Trigger asChild>
              <button
                className={`flex min-w-[200px] items-center justify-between rounded-md border px-3 py-2 text-left text-sm focus:outline-none ${
                  disabled
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                disabled={disabled}
              >
                <span>{operationLabels[damage.proposedOperation?.operation || 'REPAIR']}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </Dropdown.Trigger>
            {!disabled && (
              <Dropdown.Content className="mr-auto min-w-[200px]">
                {Object.entries(operationLabels).map(([value, label]) => (
                  <Dropdown.Item
                    key={value}
                    onClick={() => handleOperationChange(value as DamageAction)}
                    className="cursor-pointer"
                  >
                    {label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Content>
            )}
          </Dropdown.Root>
        </div>
      </div>
    </div>
  );
};
