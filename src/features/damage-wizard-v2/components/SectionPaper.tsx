import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type SectionPaperProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use form spacing (space-y-6) for form content */
  formSpacing?: boolean;
};

export const SectionPaper = ({
  title,
  description,
  icon,
  children,
  className,
  formSpacing = false,
}: SectionPaperProps) => {
  return (
    <div className={cn('bg-card border border-border rounded-lg p-6', className)}>
      {/* Header with Icon */}
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6">
          {icon && (
            <div className="h-6 w-6 text-primary">
              {icon}
            </div>
          )}
          {title && (
            <h2 className="text-xl font-semibold text-card-foreground">
              {title}
            </h2>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
      )}

      {/* Content with conditional spacing */}
      <div className={formSpacing ? 'space-y-6' : undefined}>
        {children}
      </div>
    </div>
  );
};
