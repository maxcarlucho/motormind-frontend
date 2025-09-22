import { ReactNode } from 'react';
import { ProgressCard } from './ProgressCard';

type PageShellProps = {
  header?: ReactNode;
  title?: string;
  subtitle?: string;
  content: ReactNode;
  footer?: ReactNode;
  /** Use smaller max-width for forms/single column layouts */
  narrow?: boolean;
  /** Show loading state with ProgressCard */
  loading?: boolean;
  /** Loading title for ProgressCard */
  loadingTitle?: string;
  /** Loading description for ProgressCard */
  loadingDescription?: string;
};

export const PageShell = ({
  header,
  title,
  subtitle,
  content,
  footer,
  narrow = false,
  loading = false,
  loadingTitle = 'Cargando...',
  loadingDescription = 'Estamos procesando tu solicitud',
}: PageShellProps) => {
  const maxWidth = narrow ? 'max-w-4xl' : 'max-w-7xl';

  return (
    <div className="bg-background min-h-screen">
      {/* Header slot (WizardStepper) - siempre visible */}
      {header}

      {/* Main content */}
      {loading ? (
        // Estado de carga: usar toda la altura disponible sin scroll
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 120px)' }}
        >
          <ProgressCard title={loadingTitle} description={loadingDescription} asOverlay={false} />
        </div>
      ) : (
        <div className={`${maxWidth} mx-auto p-4 pb-32`}>
          {/* Title section */}
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className="text-foreground mb-2 text-3xl font-bold">{title}</h1>}
              {subtitle && <p className="text-muted">{subtitle}</p>}
            </div>
          )}

          {/* Content slot */}
          <div className="space-y-8">{content}</div>
        </div>
      )}

      {/* Footer slot (sticky toolbar) - solo visible cuando no está cargando */}
      {footer && !loading && (
        <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-50 border-t shadow-lg">
          <div className="mx-auto p-4 md:max-w-7xl md:px-4">{footer}</div>
        </div>
      )}
    </div>
  );
};
