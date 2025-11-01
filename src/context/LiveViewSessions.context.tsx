import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LiveViewSession } from '@/types/LiveViewSession';
import apiService from '@/service/api.service';

interface LiveViewSessionsContextType {
  sessions: LiveViewSession[];
  addSession: (session: Omit<LiveViewSession, 'id'>) => string; // retorna el ID generado
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  minimizeSession: (sessionId: string) => void;
  markSessionDisconnected: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<LiveViewSession>) => void;
  getMinimizedSessions: () => LiveViewSession[];
  getActiveSessions: () => LiveViewSession[];
  closeLiveViewSession: (
    sessionId: string,
    diagnosisId: string,
    browserbaseSessionId?: string,
  ) => Promise<void>;
}

const LiveViewSessionsContext = createContext<LiveViewSessionsContextType | undefined>(undefined);

export const useLiveViewSessions = () => {
  const context = useContext(LiveViewSessionsContext);
  if (!context) {
    throw new Error('useLiveViewSessions must be used within a LiveViewSessionsProvider');
  }
  return context;
};

interface LiveViewSessionsProviderProps {
  children: ReactNode;
}

export const LiveViewSessionsProvider: React.FC<LiveViewSessionsProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<LiveViewSession[]>([]);

  // Generar ID único temporal
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addSession = useCallback(
    (sessionData: Omit<LiveViewSession, 'id'>) => {
      const id = generateTempId();
      const newSession: LiveViewSession = {
        ...sessionData,
        id,
      };

      setSessions((prev) => [...prev, newSession]);
      return id;
    },
    [generateTempId],
  );

  const removeSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
  }, []);

  const setActiveSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, isActive: true } : { ...session, isActive: false },
      ),
    );
  }, []);

  const minimizeSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, isActive: false } : session)),
    );
  }, []);

  const markSessionDisconnected = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, isConnected: false } : session,
      ),
    );
  }, []);

  const updateSession = useCallback((sessionId: string, updates: Partial<LiveViewSession>) => {
    console.log('[LiveViewSessionsContext] updateSession llamado:', { sessionId, updates });

    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session,
      );

      console.log('[LiveViewSessionsContext] Sesiones actualizadas:', updated);
      return updated;
    });
  }, []);

  const getMinimizedSessions = useCallback(() => {
    return sessions.filter((session) => !session.isActive && session.isConnected);
  }, [sessions]);

  const getActiveSessions = useCallback(() => {
    return sessions.filter((session) => session.isActive);
  }, [sessions]);

  const closeLiveViewSession = useCallback(
    async (sessionId: string, diagnosisId: string, browserbaseSessionId?: string) => {
      // Primero eliminar del estado local
      removeSession(sessionId);

      // Si hay browserbaseSessionId, notificar al backend (sin esperar respuesta)
      if (browserbaseSessionId) {
        try {
          await apiService.closeLiveViewSession(browserbaseSessionId, diagnosisId);
          console.log(`✅ [LiveViewSessions] Sesión ${browserbaseSessionId} cerrada en backend`);
        } catch (error) {
          console.error(`⚠️ [LiveViewSessions] Error cerrando sesión en backend:`, error);
          // No hacer nada, la sesión ya se eliminó del frontend
        }
      }
    },
    [removeSession],
  );

  const contextValue: LiveViewSessionsContextType = {
    sessions,
    addSession,
    removeSession,
    setActiveSession,
    minimizeSession,
    markSessionDisconnected,
    updateSession,
    getMinimizedSessions,
    getActiveSessions,
    closeLiveViewSession,
  };

  return (
    <LiveViewSessionsContext.Provider value={contextValue}>
      {children}
    </LiveViewSessionsContext.Provider>
  );
};
