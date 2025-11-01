import { cn } from '@/utils/cn';
import { ImageRemoveButton } from './ImageRemoveButton';

interface ImagePreviewItemProps {
  file: File;
  onRemove: () => void;
  showFileName?: boolean;
  className?: string;
  imageClassName?: string;
}

/**
 * Componente individual para mostrar preview de una imagen con botón de eliminar.
 * Reutilizable sin título ni contador.
 */
export const ImagePreviewItem = ({
  file,
  onRemove,
  showFileName = true,
  className,
  imageClassName,
}: ImagePreviewItemProps) => {
  return (
    <div className={cn('group relative cursor-pointer', className)}>
      <img
        src={URL.createObjectURL(file)}
        alt={`Imagen ${file.name}`}
        className={cn('border-border w-full rounded-lg border object-cover', imageClassName)}
      />
      <ImageRemoveButton onRemove={onRemove} label={`Eliminar imagen ${file.name}`} />
      {showFileName && <p className="text-muted-foreground mt-1 truncate text-xs">{file.name}</p>}
    </div>
  );
};
