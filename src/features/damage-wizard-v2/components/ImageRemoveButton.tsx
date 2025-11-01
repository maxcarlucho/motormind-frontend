import { cn } from '@/utils/cn';

interface ImageRemoveButtonProps {
  onRemove: () => void;
  label?: string;
  className?: string;
}

/**
 * Botón de eliminar imagen con comportamiento responsive.
 * - Mobile: Siempre visible (opacity-100)
 * - Desktop: Visible solo en hover (opacity-0 group-hover:opacity-100)
 * - Posición: absolute -top-2 -right-2
 * - Tamaño: w-6 h-6 rounded-full
 * - Colores: bg-destructive text-destructive-foreground
 * - Símbolo: × (multiply symbol)
 */
export const ImageRemoveButton = ({
  onRemove,
  label = 'Eliminar imagen',
  className,
}: ImageRemoveButtonProps) => {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        'bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100',
        className,
      )}
      aria-label={label}
    >
      ×
    </button>
  );
};
