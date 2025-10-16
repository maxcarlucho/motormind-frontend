export interface LiveViewSession {
  id: string; // sessionId temporal del frontend
  linkUrl: string;
  liveViewUrl: string;
  label: string; // título del diagrama
  isActive: boolean; // si el modal está abierto actualmente
  isConnected: boolean; // si la sesión de Browserbase sigue activa
  diagnosisId: string;
  browserbaseSessionId?: string; // sessionId de Browserbase para cerrar la sesión
}
