import { Dropdown } from '@/components/atoms/Dropdown';
import { DamageType, getDamageTypeLabel } from '@/types/shared/damage.types';
import { Damage, severityColors, severityLabels } from '@/types/DamageAssessment';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { DamageAction } from '../types';

interface RecommendedOperationCardProps {
  damage: Damage;
  proposedOperation: DamageAction;
  onUpdateOperation: (damageType: DamageType, newOperation: DamageAction) => void;
  relatedDamage?: Damage;
}

const operationLabels: Record<string, string> = {
  REPAIR: 'Reparar',
  REPLACE: 'Sustituir',
};

export const RecommendedOperationCard: React.FC<RecommendedOperationCardProps> = ({
  damage,
  onUpdateOperation,
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
    onUpdateOperation(damage.type as DamageType, newOperation);
    setIsOpen(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">{damage.partLabel}</h3>

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
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Operación recomendada
          </label>
          <Dropdown.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dropdown.Trigger asChild>
              <button className="flex min-w-[200px] items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
                <span>{operationLabels[damage.proposedOperation?.operation || 'REPAIR']}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </Dropdown.Trigger>
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
          </Dropdown.Root>
        </div>
      </div>
    </div>
  );
};
