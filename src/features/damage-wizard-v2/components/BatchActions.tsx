import { Button } from '@/components/atoms/Button';
import { CheckCircle2, Zap, Plus, ArrowRight } from 'lucide-react';
import { BatchActionStats } from '../types';

interface BatchActionsProps {
  stats: BatchActionStats;
  onConfirmAll: () => void;
  onConfirmHighConfidence: () => void;
  onAddManualDamage: () => void;
  onContinue: () => void;
  className?: string;
}

/**
 * Componente BatchActions - barra de acciones sticky inferior.
 * Diseñado para paridad 1:1 con el prototipo de Lovable.
 *
 * - Layout: fixed bottom + max-w-7xl + shadow-lg 
 * - Stats counter: bg-primary-muted + CheckCircle2 icon
 * - Actions: secondary (outline) + primary buttons con iconos
 * - Progress bar: bg-success + width basado en porcentaje confirmado
 * - Responsive: flex-col en mobile, flex-row en desktop
 * - States: disabled cuando stats.confirmed === 0
 * - Conditional: "Confirmar Todos" solo si no están todos confirmados
 * - High confidence: solo aparece si hay pending > 0
 */
export const BatchActions = ({ 
  stats, 
  onConfirmAll, 
  onConfirmHighConfidence, 
  onAddManualDamage,
  onContinue,
  className 
}: BatchActionsProps) => {
  const allConfirmed = stats.pending === 0 && stats.confirmed > 0;
  const hasHighConfidenceDamages = stats.pending > 0;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 ${className || ''}`}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Counter */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">
              {stats.confirmed} de {stats.total} confirmados
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddManualDamage}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Añadir daño</span>
            </Button>
            
            {hasHighConfidenceDamages && (
              <Button 
                variant="outline" 
                onClick={onConfirmHighConfidence}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Solo seguros &gt;85%
              </Button>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex gap-2">
            {!allConfirmed && (
              <Button 
                onClick={onConfirmAll}
                className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Todos
              </Button>
            )}
            
            <Button 
              onClick={onContinue}
              disabled={stats.confirmed === 0}
              size="lg"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        {stats.confirmed > 0 && (
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
