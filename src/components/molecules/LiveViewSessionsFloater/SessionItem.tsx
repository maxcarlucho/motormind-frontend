import React from 'react';
import { FileText, X } from 'lucide-react';
import { LiveViewSession } from '@/types/LiveViewSession';

interface SessionItemProps {
  session: LiveViewSession;
  onOpen: () => void;
  onClose: () => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, onOpen, onClose }) => {
  return (
    <div className="group relative flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 transition-colors duration-200 hover:bg-gray-100">
      {/* Icono */}
      <FileText className="h-4 w-4 flex-shrink-0 text-gray-500" />

      {/* Título del diagrama */}
      <span
        className="max-w-[200px] cursor-pointer truncate text-sm font-medium text-gray-900"
        title={session.label}
        onClick={onOpen}
      >
        {session.label}
      </span>

      {/* Badge de estado compacto */}
      <div className="flex-shrink-0">
        {session.isConnected ? (
          <div className="h-2 w-2 rounded-full bg-green-500" title="Activo" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-red-500" title="Desconectado" />
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 opacity-0 transition-colors duration-200 group-hover:opacity-100 hover:text-gray-600"
        title="Cerrar sesión"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
