import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
}

/**
 * Página de error consistente para el Wizard V2
 * Maneja errores de ID inexistente, permisos, etc.
 */
export const ErrorPage = ({
  title = 'No pudimos cargar este peritaje',
  message = 'Verificá el enlace o probá de nuevo.',
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = true,
}: ErrorPageProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showGoBack && (
            <Button 
              variant="outline" 
              onClick={onGoBack || (() => window.history.back())}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          )}
          
          {showRetry && (
            <Button 
              onClick={onRetry || (() => window.location.reload())}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          )}
        </div>

        {/* Additional Links */}
        <div className="pt-4 text-sm text-muted-foreground">
          <a 
            href="/damage-assessments" 
            className="hover:text-foreground underline"
          >
            Volver al listado de peritajes
          </a>
        </div>
      </div>
    </div>
  );
};
