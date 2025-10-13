import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useLiveViewSessions } from '@/context/LiveViewSessions.context';
import { SessionItem } from './SessionItem';

export const LiveViewSessionsFloater: React.FC = () => {
  const { getMinimizedSessions, setActiveSession, removeSession } = useLiveViewSessions();
  const [isExpanded, setIsExpanded] = useState(false);

  const minimizedSessions = getMinimizedSessions();

  // No renderizar si no hay sesiones minimizadas
  if (minimizedSessions.length === 0) {
    return null;
  }

  const handleSessionOpen = (sessionId: string) => {
    setActiveSession(sessionId);
  };

  const handleSessionClose = (sessionId: string) => {
    removeSession(sessionId);
  };

  return (
    <div className="fixed right-6 bottom-20 z-40">
      {!isExpanded ? (
        // Estado colapsado
        <button
          onClick={() => setIsExpanded(true)}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-gray-700 shadow-lg transition-colors duration-200 hover:bg-gray-50"
          title={`Ver ${minimizedSessions.length} ${minimizedSessions.length === 1 ? 'recurso' : 'recursos'} activos`}
        >
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">
            Ver {minimizedSessions.length} {minimizedSessions.length === 1 ? 'recurso' : 'recursos'}
          </span>
        </button>
      ) : (
        // Estado expandido
        <div className="relative rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
          {/* Botón para colapsar */}
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute -top-2 -right-2 z-10 cursor-pointer rounded-full bg-gray-500 p-1 text-white shadow-md transition-colors duration-200 hover:bg-gray-600"
            title="Cerrar"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Lista de sesiones - usando flex-wrap para aprovechar el espacio horizontal */}
          <div className="flex max-w-[80vw] flex-wrap gap-2">
            {minimizedSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onOpen={() => handleSessionOpen(session.id)}
                onClose={() => handleSessionClose(session.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
