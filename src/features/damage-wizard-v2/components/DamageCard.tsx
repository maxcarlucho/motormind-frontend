import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Damage, severityColors, severityLabels } from '@/types/DamageAssessment';
import { getDamageTypeLabel } from '@/types/shared/damage.types';

interface DamageCardProps {
  damage: Damage;
  isConfirmed: boolean;
  isUserCreated: boolean;
  onStatusChange: (id: string, status: 'confirmed' | 'rejected') => void;
  className?: string;
}

// const severityColors = {
//   leve: 'text-success-foreground bg-success',
//   medio: 'text-warning-foreground bg-warning',
//   grave: 'text-destructive-foreground bg-destructive',
// };

const confidenceColor = (confidence: number): string => {
  const confidencePercent = confidence * 100;
  if (confidencePercent >= 90) return 'bg-success text-success-foreground';
  if (confidencePercent >= 80) return 'bg-yellow-100 text-yellow-800';
  return 'bg-muted text-muted-foreground';
};

export const DamageCard = ({
  damage,
  isConfirmed,
  isUserCreated,
  onStatusChange,
  className,
}: DamageCardProps) => {
  const isPending = !isConfirmed && !isUserCreated;

  const primaryEvidence = damage.evidences?.[0];
  const roi = primaryEvidence?.roi;

  const handleClick = () => {
    if (isConfirmed) {
      onStatusChange(damage._id!, 'rejected');
    } else {
      onStatusChange(damage._id!, 'confirmed');
    }
  };

  return (
    <div
      className={cn(
        'bg-card relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
        {
          'border-success bg-success-muted/30': isConfirmed,
          'border-border hover:border-primary': isPending,
        },
        className,
      )}
      onClick={handleClick}
    >
      {/* Status Icon */}
      <div className="absolute top-3 right-3 z-10">
        {isConfirmed && (
          <CheckCircle2 className="text-success bg-success-foreground h-6 w-6 rounded-full" />
        )}
      </div>

      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <img
          src={damage.evidences?.[0]?.originalUrl || ''}
          alt={`Daño en ${damage.area}`}
          className="h-full w-full object-cover"
        />

        {roi && roi.type === 'bbox' && (
          <div
            className="pointer-events-none absolute rounded-sm border-2 border-red-500 bg-red-500/20"
            style={{
              left: `${roi.x * 100}%`,
              top: `${roi.y * 100}%`,
              width: `${roi.w * 100}%`,
              height: `${roi.h * 100}%`,
            }}
            title="Área del daño detectado"
          />
        )}

        {/* Confidence Badge - Solo mostrar si NO es un daño manual */}
        {!isUserCreated && (
          <div
            className={cn(
              'absolute bottom-2 left-2 rounded-full px-2 py-1 text-xs font-medium',
              confidenceColor(damage.confidence || 0),
            )}
          >
            {(damage.confidence || 0 * 100).toFixed(1)}% seguro
          </div>
        )}

        {/* Badge "Manual" - Solo mostrar si es un daño creado por usuario */}
        {isUserCreated && (
          <div className="absolute bottom-2 left-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white">
            Manual
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        {/* Zone and Subzone */}
        <div>
          <h3 className="text-card-foreground font-semibold">{damage.area}</h3>
          {damage.subarea && <p className="text-muted text-sm">{damage.subarea}</p>}
        </div>

        {/* Damage Type */}
        <p className="text-card-foreground text-sm font-medium">
          {getDamageTypeLabel(damage.type)}
        </p>

        {/* Severity Badge */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span
            className={cn(
              'rounded-md border px-2 py-1 text-xs font-medium',
              severityColors[damage.severity],
            )}
          >
            {severityLabels[damage.severity]}
          </span>
        </div>
      </div>

      {/* Action Hint */}
      {isPending && (
        <div className="text-muted absolute right-2 bottom-2 text-xs">Toca para confirmar</div>
      )}
    </div>
  );
};
