import { cn } from '@/utils/cn';
import { Damage, severityColors, severityLabels } from '@/types/DamageAssessment';

interface DamageCardSeverityBadgeProps {
  damage: Damage;
  isPending: boolean;
}

export const DamageCardSeverityBadge = ({
  damage,
  isPending,
}: DamageCardSeverityBadgeProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'rounded-md border px-2 py-1 text-xs font-medium',
            severityColors[damage.severity],
          )}
        >
          {severityLabels[damage.severity]}
        </span>
      </div>
      <div className="text-muted text-xs">
        {isPending ? 'Toca para confirmar' : 'Toca para editar'}
      </div>
    </div>
  );
};
