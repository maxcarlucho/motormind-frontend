import { cn } from '@/utils/cn';

interface ImageRemoveButtonProps {
  onRemove: () => void;
  label?: string;
  className?: string;
}

/**
 * Botón de eliminar imagen con hover state.
 * Implementa paridad 1:1 con el repo de diseño:
 * - Posición: absolute -top-2 -right-2
 * - Tamaño: w-6 h-6 rounded-full
 * - Estados: opacity-0 group-hover:opacity-100
 * - Colores: bg-destructive text-destructive-foreground
 * - Símbolo: × (multiply symbol)
 */
export const ImageRemoveButton = ({ 
  onRemove, 
  label = 'Eliminar imagen',
  className 
}: ImageRemoveButtonProps) => {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        'bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs opacity-0 transition-opacity group-hover:opacity-100',
        className
      )}
      aria-label={label}
    >
      ×
    </button>
  );
};
