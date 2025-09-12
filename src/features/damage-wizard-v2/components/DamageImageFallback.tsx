import { cn } from '@/utils/cn';
import { Car } from 'lucide-react';

interface DamageImageFallbackProps {
  area: string;
  className?: string;
}

export const DamageImageFallback = ({ className }: DamageImageFallbackProps) => {
  return (
    <div
      className={cn(
        'from-muted/30 to-muted/60 flex h-full w-full flex-col items-center justify-center bg-gradient-to-br',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Car className="text-muted-foreground/60 h-12 w-12" />
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">Sin imagen</p>
        </div>
      </div>
    </div>
  );
};
