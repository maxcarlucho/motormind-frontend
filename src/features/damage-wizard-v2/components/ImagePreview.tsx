import { cn } from '@/utils/cn';
import { ImagePreviewItem } from './ImagePreviewItem';

interface ImagePreviewProps {
  files: File[];
  onRemoveImage: (index: number) => void;
  maxFiles?: number;
  className?: string;
}

/**
 * Componente para mostrar preview de imágenes con botón de eliminar en hover.
 * Implementa paridad 1:1 con el repo de diseño:
 * - Grid responsive: grid-cols-2 md:grid-cols-4 gap-4
 * - Botón eliminar: absolute -top-2 -right-2, opacity-0 group-hover:opacity-100
 * - Colores: bg-destructive text-destructive-foreground
 * - Tamaño imagen: w-full h-24 object-cover
 */
export const ImagePreview = ({
  files,
  onRemoveImage,
  maxFiles = 20,
  className,
}: ImagePreviewProps) => {
  if (files.length === 0) return null;

  return (
    <div className={cn('mt-6', className)}>
      <p className="mb-3 text-sm font-medium">
        Imágenes seleccionadas ({files.length}/{maxFiles})
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {files.map((file, index) => (
          <ImagePreviewItem
            key={index}
            file={file}
            onRemove={() => onRemoveImage(index)}
            imageClassName="h-24"
          />
        ))}
      </div>
    </div>
  );
};
