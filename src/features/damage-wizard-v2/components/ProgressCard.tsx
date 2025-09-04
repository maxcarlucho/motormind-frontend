import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEffect } from 'react';

interface ProgressCardProps {
  title: string;
  description: string;
  progress?: number;
  className?: string;
  asOverlay?: boolean;
}

export const ProgressCard = ({
  title,
  description,
  className,
  asOverlay = false,
}: ProgressCardProps) => {
  // Bloquear scroll cuando el overlay está activo
  useEffect(() => {
    if (asOverlay) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [asOverlay]);

  const cardContent = (
    <div
      className={cn(
        'mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Clock className="animate-wiggle h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-3 text-center text-xl font-semibold text-gray-900">{title}</h3>

      {/* Description */}
      <p className="mb-8 text-center text-sm leading-relaxed text-gray-600">{description}</p>

      {/* Progress percentage - Comentado */}
      {/* <p className="text-center text-sm font-medium text-gray-700">
        {Math.round(progress)}% completado
      </p> */}
    </div>
  );

  if (asOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6">
      {cardContent}
    </div>
  );
};
