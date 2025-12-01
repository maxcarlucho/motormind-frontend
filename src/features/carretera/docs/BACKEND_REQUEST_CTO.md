# Solicitud Backend: Acceso Público para Clientes de Carretera

## Resumen Ejecutivo

Necesitamos que 3 endpoints existentes puedan ser accedidos **sin autenticación de usuario** para que los clientes de asistencia en carretera puedan responder el cuestionario de diagnóstico desde el link que reciben por WhatsApp.

---

## Contexto del Problema

### Flujo actual de Carretera:
1. **Sandra (operadora)** recibe llamada del cliente varado
2. Sandra crea el caso en Motormind y genera un **link único**
3. Sandra envía el link por **WhatsApp** al cliente
4. **Cliente** abre el link en su móvil (sin cuenta, probablemente en incógnito)
5. Cliente responde preguntas → Se genera pre-diagnóstico IA
6. Gruista ve el resultado y decide: reparar o remolcar

### El problema:
En el paso 4, cuando el cliente abre el link, el frontend intenta llamar al backend para obtener las preguntas y guardar respuestas. Pero el backend responde **401 Unauthorized** porque el cliente no tiene JWT de sesión.

**Error actual:**
```
GET /api/v1/cars/:carId/diagnosis/:diagnosisId → 401 Unauthorized
```

---

## Solución Propuesta

### Endpoints que necesitan acceso público/limitado:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/cars/:carId/diagnosis/:diagnosisId` | Obtener preguntas del diagnóstico |
| `PUT` | `/api/v1/cars/:carId/diagnosis/:diagnosisId/answers` | Guardar respuestas del cliente |
| `POST` | `/api/v1/cars/:carId/diagnosis/:diagnosisId/preliminary` | Generar pre-diagnóstico IA |

### Opciones de Implementación:

#### Opción 1: Validar Token de Carretera (Recomendada)
El frontend ya genera un token JWT firmado con la info del caso:
```json
{
  "t": "client",
  "c": "caseId",
  "car": "carId",
  "d": "diagnosisId",
  "exp": 1765185777699
}
```

El backend podría:
1. Aceptar este token en el header `Authorization: Bearer <token>` o como query param `?token=xxx`
2. Validar la firma (compartimos el secret)
3. Verificar que el `diagnosisId` del token coincide con el de la URL
4. Si es válido, permitir la operación

**Ventaja:** Máxima seguridad, solo quien tiene el link puede acceder a ese caso específico.

#### Opción 2: Token de Servicio
Crear un JWT "de sistema" o "service account" que:
- El frontend use para llamadas de clientes anónimos
- Tenga permisos limitados solo a operaciones de diagnóstico
- No expire o tenga expiración larga

**Ventaja:** Implementación simple en backend, solo agregar el token a la whitelist.

#### Opción 3: Endpoints Públicos con Validación
Hacer estos endpoints accesibles sin auth pero con validaciones:
- Rate limiting por IP
- Validar que el `diagnosisId` existe y está en estado `waiting-client` o `client-answering`
- Solo permitir operaciones sobre diagnósticos creados en las últimas 24-48h

**Ventaja:** No requiere cambios en el frontend.

---

## Detalles Técnicos

### Token de Carretera (Opción 1)
```typescript
// Estructura del token que ya generamos
interface CarreteraToken {
  v: "1",              // Versión
  t: "client",         // Tipo: client | workshop
  c: "caseId",         // ID del caso
  car: "carId",        // ID del coche
  d: "diagnosisId",    // ID del diagnóstico
  exp: 1765185777699,  // Expiración (Unix timestamp ms)
  iat: 1764580977699   // Fecha de creación
}

// Firmado con HMAC-SHA256
// Secret actual: "motormind-carretera-secret-2024"
// (podemos cambiarlo a una variable de entorno compartida)
```

### Ejemplo de Request
```bash
# Actualmente falla con 401:
curl -X GET "https://motormind-backend-development.up.railway.app/api/v1/cars/687f9f989856da921c1a8f75/diagnosis/692d5df9ae97ffec65c218f9"

# Con token de Carretera (propuesta):
curl -X GET "https://motormind-backend-development.up.railway.app/api/v1/cars/687f9f989856da921c1a8f75/diagnosis/692d5df9ae97ffec65c218f9" \
  -H "Authorization: Bearer eyJ2IjoiMSIsInQiOiJjbGllbnQiLC..."

# O como query param:
curl -X GET "https://motormind-backend-development.up.railway.app/api/v1/cars/687f9f989856da921c1a8f75/diagnosis/692d5df9ae97ffec65c218f9?access_token=eyJ2IjoiMSIsInQiOiJjbGllbnQiLC..."
```

---

## Impacto

### Sin este cambio:
- ❌ Clientes no pueden responder preguntas desde el link de WhatsApp
- ❌ El flujo de Carretera no funciona para usuarios sin cuenta
- ❌ Sandra tendría que hacer las preguntas por teléfono manualmente

### Con este cambio:
- ✅ Cliente abre link → responde preguntas → se genera diagnóstico IA
- ✅ Flujo 100% automatizado
- ✅ Sandra solo envía el link y espera el resultado

---

## Prioridad

**Alta** - Es bloqueante para el lanzamiento del MVP de Carretera con Bonilla Motor.

---

## Preguntas para Ale

1. ¿Cuál de las 3 opciones prefieres implementar?
2. Si es la Opción 1, ¿qué secret quieres usar para firmar los tokens? (podemos usar variable de entorno compartida)
3. ¿Hay alguna otra consideración de seguridad que debamos tener en cuenta?
4. ¿Tiempo estimado de implementación?

---

*Documento generado: 2025-12-01*
*Proyecto: MVP Carretera Inteligente - Motormind*
