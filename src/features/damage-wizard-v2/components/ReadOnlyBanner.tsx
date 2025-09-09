import { Eye, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ReadOnlyBannerProps {
  className?: string;
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({ className }) => {
  return (
    <div className={cn('mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4', className)}>
      <div className="flex items-center gap-3">
        <Eye className="h-5 w-5 flex-shrink-0 text-blue-600" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">Modo solo lectura</h3>
          <p className="mt-1 text-sm text-blue-700">
            Estás viendo un paso anterior ya completado. Los datos no se pueden modificar.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-blue-600" />
      </div>
    </div>
  );
};
