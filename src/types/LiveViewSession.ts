export interface LiveViewSession {
  id: string; // sessionId from backend
  linkUrl: string;
  liveViewUrl: string;
  label: string; // título del diagrama
  isActive: boolean; // si el modal está abierto actualmente
  isConnected: boolean; // si la sesión de Browserbase sigue activa
  diagnosisId: string;
}
