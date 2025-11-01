import { Upload, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/atoms/Button';

type DragZoneProps = {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  error?: string | null;
};

export const DragZone = ({
  onFilesSelected,
  maxFiles = 20,
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png'],
  className,
  error: externalError,
}: DragZoneProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external error if provided, otherwise use internal error
  const error = externalError || internalError;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    setInternalError(null);

    const files = Array.from(e.dataTransfer.files);
    validateAndProcessFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndProcessFiles(files);
  };

  const validateAndProcessFiles = (files: File[]) => {
    // Validate file types
    const invalidFiles = files.filter((file) => !acceptedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setInternalError(`Tipo de archivo no válido: ${invalidFiles.map((f) => f.name).join(', ')}`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter((file) => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setInternalError(`Archivo demasiado grande: ${oversizedFiles.map((f) => f.name).join(', ')}`);
      return;
    }

    // Validate number of files
    if (files.length > maxFiles) {
      setInternalError(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    onFilesSelected(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag zone */}
      <div
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/20'
            : error
              ? 'border-destructive'
              : 'border-border',
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Upload icon */}
        <Upload className="text-muted mx-auto mb-4 h-12 w-12" />

        {/* Main instruction */}
        <p className="mb-2 text-lg font-medium">
          Arrastra las imágenes aquí o haz clic para seleccionar
        </p>

        {/* Requirements */}
        <p className="text-muted mb-4 text-sm">
          Máximo {maxFiles} imágenes • JPG, JPEG, PNG • Máximo {maxSizeMB}MB cada una
        </p>

        {/* Recommendation */}
        <p className="text-muted mb-4 text-xs">
          Recomendado: fotos de 360° alrededor del vehículo con buena luz.
        </p>

        {/* Select files button - using existing Button component */}
        <Button variant="outline" onClick={handleClick}>
          Seleccionar Archivos
        </Button>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mt-4 flex items-center gap-2 rounded-md border p-3 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
