import { Badge } from '@/components/atoms/Badge';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface DamageOperationsGroupProps {
  title: string;
  count: number;
  isSubstitutionActive: boolean;
  children: React.ReactNode;
}

export const DamageOperationsGroup: React.FC<DamageOperationsGroupProps> = ({
  title,
  count,
  isSubstitutionActive,
  children,
}) => {
  return (
    <div className="space-y-4" role="region" aria-labelledby={`group-${title}`}>
      {/* Header del grupo */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h3 id={`group-${title}`} className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <Badge variant="secondary" className="w-fit text-xs">
            {count} {count === 1 ? 'daño' : 'daños'}
          </Badge>
          {isSubstitutionActive && (
            <Badge variant="destructive" className="text-xs">
              Sustitución activa
            </Badge>
          )}
        </div>
      </div>

      {/* Alerta de sustitución */}
      {isSubstitutionActive && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
          <p className="text-sm text-red-900">
            Una pieza marcada para sustitución bloquea las reparaciones de otros daños en la misma
            pieza.
          </p>
        </div>
      )}

      {/* Cards de daños */}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
