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

  // Si está cargando, mostrar ProgressCard
  if (loading) {
    return (
      <div className="bg-background min-h-screen pb-32">
        {header}
        <div className={`${maxWidth} mx-auto p-4`}>
          <ProgressCard title={loadingTitle} description={loadingDescription} asOverlay={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header slot (WizardStepper) - will be rendered by parent */}
      {header}

      {/* Main content */}
      <div className={`${maxWidth} mx-auto p-4`}>
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

      {/* Footer slot (sticky toolbar) */}
      {footer && (
        <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-50 border-t shadow-lg">
          <div className={`${maxWidth} mx-auto p-4`}>{footer}</div>
        </div>
      )}
    </div>
  );
};
