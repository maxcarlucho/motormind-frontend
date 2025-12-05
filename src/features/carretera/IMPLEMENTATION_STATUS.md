# Estado de Implementación - MVP Carretera

## ✅ Completado

### Frontend - Componentes y UI
- ✅ **OBDDiagnosisForm** - Formulario para captura de códigos OBD y comentarios del técnico
  - Validación de formato de códigos OBD (P/B/C/U + 4 dígitos)
  - Campos para códigos y observaciones del técnico
  - Referencia visual de códigos OBD comunes

- ✅ **AIAssessmentSummary** - Muestra el pre-diagnóstico generado por IA
  - Muestra diagnosis, nivel de confianza, recomendación
  - Semáforo visual (🟢 Reparar / 🟡 Más info / 🔴 Remolcar)

- ✅ **WorkshopReception** - Página principal del taller
  - Integración con OBDDiagnosisForm
  - Flujo: Aceptar caso → Formulario OBD → Generar diagnóstico
  - Muestra toda la info del caso (cliente, vehículo, Q&A, pre-diagnóstico IA)

### Frontend - Hooks y Lógica
- ✅ **useWorkshopCase** - Hook para gestión de casos del taller
  - `acceptCase()` - Acepta el caso y genera orden de servicio
  - `submitOBDDiagnosis(obdCodes, comments)` - Envía diagnóstico OBD
  - `updateRepairStatus()` - Actualiza estado de reparación
  - Funcionando con localStorage para desarrollo

### Frontend - Servicios
- ✅ **carreteraApi.service.ts** - Servicio preparado para API real
  - Estructura completa de endpoints `/api/v1/carretera/*`
  - Endpoints para: cases, client, gruista, workshop
  - Interceptors para autenticación y manejo de errores
  - Listo para conectar cuando backend esté disponible

### Frontend - Tipos
- ✅ **carretera.types.ts** - Tipos TypeScript actualizados
  - `OBDDiagnosisData` - Estructura para datos OBD
  - `GeneratedDiagnosis` - Estructura para diagnóstico generado
  - `WorkshopCaseDetailed` actualizado con campos OBD

## 🔄 Flujo Actual del Taller

1. **Recepción del caso** (`/carretera/t/:id`)
   - Taller ve información completa del caso
   - Pre-diagnóstico IA visible
   - Decisión del gruista visible

2. **Aceptación del caso**
   - Click en "ACEPTAR CASO"
   - Se genera orden de servicio
   - Se muestra formulario OBD automáticamente

3. **Diagnóstico OBD**
   - Técnico ingresa códigos OBD del escáner
   - Añade observaciones de inspección física
   - Submit genera diagnóstico completo

4. **Estado de reparación**
   - Tracker visual del progreso
   - Estados: pendiente → inspeccionando → esperando repuestos → reparando → probando → completado

## 📡 Integración con Backend (✅ Completado v2.6)

### Endpoints utilizados actualmente:
```
GET    /diagnoses                                    → Listar casos (operador/gruista)
GET    /cars/diagnosis/:diagnosisId                  → Obtener caso individual
DELETE /diagnoses/:id                                → Eliminar caso
GET    /cars/vin-or-plate?plate=XXX                  → Buscar/crear vehículo (TecDoc)
POST   /cars/:carId/questions                        → Crear diagnóstico
PUT    /cars/:carId/diagnosis/:diagnosisId/answers   → Guardar respuestas cliente
POST   /cars/:carId/diagnosis/:diagnosisId/preliminary → Generar pre-diagnóstico
```

### Estado actual:
- ✅ Operador y Gruista cargan casos desde MongoDB (`/diagnoses`)
- ✅ Eliminación de casos funciona en MongoDB (`apiService.deleteDiagnosis`)
- ✅ Datos de carretera persistidos en campo `notes` como JSON
- ✅ localStorage usado como cache/fallback
- ✅ Lógica de estado basada en códigos OBD:
  - Con OBD → `completed`
  - Sin OBD pero con respuestas → `in-progress`
  - Sin respuestas → `pending`/`new`

## 🧪 Testing Local

Para probar el flujo completo con localStorage:

1. Navegar a `/carretera/t/workshop-case-001`
2. Revisar información del caso
3. Click en "ACEPTAR CASO"
4. Ingresar códigos OBD (ej: P0171, P0300)
5. Añadir observaciones técnicas
6. Click en "Generar Diagnóstico Completo"
7. Verificar que se actualiza el estado

## 🚀 Próximos Pasos

1. ~~**Backend** - Implementar endpoints~~ ✅ Usando endpoints existentes de Motormind
2. ~~**Integración** - Conectar frontend con API real~~ ✅ Completado v2.6
3. **Testing E2E** - Probar flujo completo con backend en producción
4. **Mejoras futuras**:
   - Subida de fotos desde el taller
   - Notificaciones en tiempo real al cliente
   - Endpoint dedicado `/api/v1/carretera/*` (opcional, actualmente reutilizamos `/diagnoses`)

## 📝 Notas Importantes

- **NO se modifica el core de Motormind** - Todo está aislado en `/features/carretera`
- **Backend integrado** - Datos persistidos en MongoDB, localStorage es solo cache
- **Tipos TypeScript completos** - Todo tipado para evitar errores
- **JSON en `notes`** - Datos de carretera se guardan como JSON estructurado en el campo `notes` del Diagnosis

## 🌐 Configuración de URLs y Variables de Entorno

### Variables requeridas en Railway (Frontend)

```env
# URL pública para links de clientes (WhatsApp, etc.)
VITE_CARRETERA_PUBLIC_URL=https://carretera-app.motormind.io

# Token de servicio para acceso anónimo (clientes sin login)
# IMPORTANTE: Sin este token, los clientes no pueden guardar respuestas al backend
VITE_CARRETERA_SERVICE_TOKEN=<JWT_token_de_servicio>

# URL del backend (debe ser la misma en todos los frontends)
VITE_API_URL=https://motormind-backend-development.up.railway.app
```

### Arquitectura Multi-Dominio

El sistema usa dos dominios de frontend:
- **`carretera-app.motormind.io`** - Donde el cliente responde las preguntas
- **`development-app.motormind.io`** - Donde el operador/gruista gestiona casos

**Importante:** localStorage NO se comparte entre dominios, por lo que:
1. El cliente guarda respuestas en el **backend** (usando SERVICE_TOKEN)
2. El gruista obtiene respuestas del **backend** (usando su token de login)

### Flujo de Sincronización

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   carretera-app     │     │      Backend        │     │  development-app    │
│   (Cliente)         │     │   (Motormind API)   │     │  (Operador/Gruista) │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │                           │
         │  1. Cliente responde      │                           │
         │─────────────────────────>│                           │
         │  PUT /cars/:id/diagnosis  │                           │
         │  (SERVICE_TOKEN)          │                           │
         │                           │                           │
         │                           │  2. Gruista consulta      │
         │                           │<─────────────────────────│
         │                           │  GET /cars/diagnosis/:id  │
         │                           │  (User Token)             │
         │                           │                           │
         │                           │  3. Respuestas del backend│
         │                           │─────────────────────────>│
```

**Archivos relacionados:**
- `constants/publicUrl.ts` - Función `getPublicClientUrl()` que genera URLs públicas
- `services/carreteraApi.service.ts` - Usa SERVICE_TOKEN para acceso anónimo
- `hooks/useGruistaCase.ts` - Siempre consulta backend para respuestas actualizadas
- `hooks/useClientAssessment.ts` - Guarda respuestas en backend con SERVICE_TOKEN

## 🐛 Bugs Resueltos

### [2025-12-05] Respuestas no aparecían en vista del gruista
**Problema:** El cliente respondía desde `carretera-app` pero el gruista en `development-app` veía "Sin respuesta".

**Causa:** El hook `useGruistaCase` leía respuestas de localStorage en lugar del backend. Como son dominios diferentes, localStorage no se comparte.

**Solución:** Modificado `useGruistaCase.ts` para SIEMPRE consultar el backend y obtener las respuestas más recientes, sincronizando luego con localStorage.

---
*Última actualización: 2025-12-05*
*MVP funcionando con sincronización backend entre dominios*