interface ManualCreatedDamageBadgeProps {
  className?: string;
}

/**
 * Badge que indica que un daño fue creado manualmente por el usuario.
 * Se muestra en la esquina inferior izquierda de la imagen del daño.
 */
export const ManualCreatedDamageBadge = ({ className }: ManualCreatedDamageBadgeProps) => {
  return (
    <div
      className={`absolute bottom-2 left-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white ${className || ''}`}
    >
      Manual
    </div>
  );
};
