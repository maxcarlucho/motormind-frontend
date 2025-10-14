import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LiveViewSession } from '@/types/LiveViewSession';

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
  };

  return (
    <LiveViewSessionsContext.Provider value={contextValue}>
      {children}
    </LiveViewSessionsContext.Provider>
  );
};
