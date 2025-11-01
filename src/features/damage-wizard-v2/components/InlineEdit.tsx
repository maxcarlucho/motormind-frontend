import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface InlineEditProps {
  value: number;
  onSave: (value: number) => void;
  prefix?: string;
  suffix?: string;
  isAdjusted?: boolean;
  originalValue?: number;
  className?: string;
}

/**
 * Componente InlineEdit para edición inline de valores numéricos.
 * Diseñado para paridad 1:1 con el prototipo de Lovable.
 *
 * - Click: activa modo edición con focus + select automático
 * - Enter: guarda valor y sale del modo edición
 * - Escape: cancela edición y restaura valor original
 * - Blur: guarda automáticamente el valor
 * - isAdjusted: aplica styling de "modificado manualmente" (text-primary + font-semibold)
 * - Hover: bg-accent + cursor-pointer para indicar interactividad
 * - Tooltip: muestra valor original si fue ajustado
 */
export const InlineEdit = ({
  value,
  onSave,
  prefix = '',
  suffix = '',
  isAdjusted = false,
  originalValue,
  className,
}: InlineEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
    } else {
      // Reset to original value if invalid
      setEditValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-8 w-24 rounded-md border px-3 py-2 text-right text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        type="number"
        step="0.01"
        min="0"
      />
    );
  }

  const tooltipText =
    isAdjusted && originalValue
      ? `Valor original: ${prefix}${originalValue.toFixed(2)}${suffix}`
      : 'Clic para editar';

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        'hover:bg-accent hover:text-accent-foreground cursor-pointer rounded px-2 py-1 transition-colors',
        isAdjusted ? 'text-primary font-semibold' : '',
        className,
      )}
      title={tooltipText}
    >
      {prefix}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
};
