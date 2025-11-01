import { useEffect } from 'react';

export const useBrowserbaseDisconnect = (onDisconnect: () => void) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "browserbase-disconnected") {
        console.log('🔌 [BROWSERBASE_DISCONNECT] Sesión desconectada por timeout');
        onDisconnect();
      }
    };

    // Escuchar mensajes de Browserbase sobre desconexión
    window.addEventListener("message", handleMessage);

    // Cleanup del listener
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onDisconnect]);
};
