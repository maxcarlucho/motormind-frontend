import { Button } from '@/components/atoms/Button';
import { ArrowLeft, Save, Settings, FileText } from 'lucide-react';

interface ValuationActionsProps {
  onBack: () => void;
  onSaveTemplate: () => void;
  onViewSettings: () => void;
  onFinalize: () => void;
  className?: string;
}

/**
 * Acciones finales para la página de valoración.
 * Diseñado para paridad 1:1 con el prototipo de Lovable.
 *
 * - Layout: fixed bottom + bg-card + border-t + shadow-lg
 * - Left: "Volver a Operaciones" con ArrowLeft
 * - Right: 3 botones secundarios + 1 botón principal
 * - Buttons: Save (Guardar Plantilla), Settings (Ver Ajustes), FileText (Finalizar Evaluación)
 * - Primary action: "Finalizar Evaluación" con size="lg"
 * - Spacing: gap-3 entre botones
 */
export const ValuationActions = ({ 
  onBack, 
  onSaveTemplate, 
  onViewSettings, 
  onFinalize,
  className 
}: ValuationActionsProps) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 ${className || ''}`}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Operaciones
          </Button>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onSaveTemplate} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Guardar Plantilla
            </Button>
            
            <Button variant="outline" onClick={onViewSettings} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Ver Ajustes
            </Button>
            
            <Button onClick={onFinalize} size="lg" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Finalizar Evaluación
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
