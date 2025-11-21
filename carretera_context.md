# Contexto del Proyecto: Carretera (PoC Mapfre)

Este documento sirve como la "Estrella del Norte" para el desarrollo del MVP de Carretera. Úsalo para dar contexto a cualquier nueva sesión de desarrollo.

## 🎯 El Objetivo
Construir una herramienta de **Asistencia en Carretera Inteligente** que permita a Mapfre y Bonilla Motor reducir costes evitando traslados innecesarios.

**Mantra:** "Información antes de la llegada = Decisión correcta."

## 👤 Los Actores
1.  **El Cliente (Conductor):** Está estresado. Necesita una interfaz ultra-simple (tipo chat) para contar qué le pasa a su coche mientras espera la grúa.
2.  **El Gruista (Paco):** Está trabajando en la calle, con sol/lluvia y guantes. Necesita botones grandes, información visual (Semáforo) y cero fricción. No quiere leer textos largos.
3.  **El Taller:** Quiere saber qué le llega antes de que baje de la grúa.

## 🛠 Stack Tecnológico
*   **Base:** Motormind Frontend (React + Vite + Tailwind).
*   **Ubicación:** `src/features/carretera`.
*   **Estilo:** Mobile-first estricto. Diseño utilitario y de alto contraste.
*   **Backend:** Motormind API (reutilización de endpoints de diagnóstico).

## 🚦 El Semáforo (Core Feature)
La IA debe traducir problemas técnicos complejos en 3 colores para el gruista:
*   🟢 **VERDE (In-situ):** Problemas de batería, falta de combustible, neumáticos. -> *Acción: Reparar.*
*   🟡 **AMARILLO (Duda):** Ruidos extraños, testigos naranjas. -> *Acción: Verificar.*
*   🔴 **ROJO (Taller):** Humo, testigos rojos, fallo motor grave. -> *Acción: Remolcar.*

## 📝 Reglas de Oro
1.  **No romper Motormind:** Todo lo nuevo vive en `/carretera`. No tocar el flujo core de talleres existentes.
2.  **Velocidad:** La carga debe ser instantánea. El gruista no tiene 4G siempre.
3.  **Simplicidad:** Si se puede explicar en 3 palabras, no uses 4.

---
*Versión 1.0 - Noviembre 2025*
