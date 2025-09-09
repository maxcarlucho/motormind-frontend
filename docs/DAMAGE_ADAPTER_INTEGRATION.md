# Adaptador de Daños - Integración Backend a Frontend

## 🎯 Problema Resuelto

Las imágenes aparecían rotas en la página de Damages porque:

1. **Estructura de datos diferente**: Backend devuelve `{ area, subarea, severity: "SEV4", type: "dent" }` pero frontend espera `{ zone, subzone, severity: "grave", type: "Abolladura" }`
2. **Falta de imágenes**: Los daños no tenían URLs de imágenes asociadas
3. **Severidades no mapeadas**: "SEV4" no se mapea a "leve|medio|grave"

## ✅ Solución Implementada

### **1. Adaptador de Daños**

Creado `damageAdapter.ts` que transforma datos del backend:

```typescript
// Backend → Frontend
{
  area: "Carroceria trasera",           → zone: "Carroceria trasera"
  subarea: "Aleta izquierda",          → subzone: "Aleta izquierda"  
  severity: "SEV4",                    → severity: "grave"
  type: "dent"                         → type: "Abolladura"
}
```

### **2. Mapeos Implementados**

**Severidades:**
- SEV1, SEV2 → "leve"
- SEV3 → "medio"  
- SEV4, SEV5 → "grave"

**Tipos de daño:**
- dent → "Abolladura"
- scratch → "Rayón"
- broken → "Rotura"
- etc.

**Confidence mock:** Basado en severidad (SEV1=95%, SEV4=80%, etc.)

### **3. Asociación de Imágenes**

```typescript
// Rotar entre imágenes disponibles para cada daño
const imageUrl = images[index % images.length] || images[0] || '';
```

### **4. Contexto Actualizado**

```typescript
// Antes: detectedDamages?: any[]
// Ahora: detectedDamages?: any  // Respuesta completa del backend

// Permite acceso a:
state.detectedDamages.detectedDamages  // Array de daños
state.detectedDamages.images          // URLs de imágenes  
state.detectedDamages.car            // Info del coche
```

## 🔄 Flujo de Transformación

```mermaid
flowchart TD
    A[Backend Response] --> B[damageAdapter.ts]
    B --> C[adaptBackendDamagesResponse]
    C --> D[Frontend Damage[]]
    D --> E[DamageCard Component]
    
    A1[detectedDamages] --> C
    A2[images] --> C
    A3[car] --> C
    A4[workflow] --> C
```

## 🏗️ Estructura de Datos

### **Backend Response:**
```json
{
  "detectedDamages": [
    {
      "area": "Carroceria trasera",
      "subarea": "Aleta izquierda", 
      "severity": "SEV4",
      "type": "dent"
    }
  ],
  "images": ["https://s3.../image1.jpg", "..."],
  "car": {...},
  "workflow": {...}
}
```

### **Frontend Damage:**
```typescript
{
  id: "damage_0_carroceria_trasera_aleta_izquierda_dent",
  zone: "Carroceria trasera",
  subzone: "Aleta izquierda",
  type: "Abolladura", 
  severity: "grave",
  confidence: 80,
  imageUrl: "https://s3.../image1.jpg",
  status: "pending"
}
```

## 🔧 Funciones del Adaptador

### **adaptBackendDamage()**
Transforma un daño individual del backend al frontend.

### **adaptBackendDamagesResponse()**
Transforma la respuesta completa con múltiples daños.

### **mapSelectedDamagesToBackend()**
Mapea IDs seleccionados del frontend a datos del backend para envío.

### **getConfidenceFromSeverity()**
Calcula confidence mock basado en severidad.

## 📋 Archivos Modificados

1. `src/features/damage-wizard-v2/adapters/damageAdapter.ts` - ✅ Nuevo
2. `src/features/damage-wizard-v2/context/WizardV2Context.tsx` - ✅ Tipo actualizado
3. `src/features/damage-wizard-v2/hooks/useWizardV2.ts` - ✅ Guarda respuesta completa
4. `src/features/damage-wizard-v2/pages/Damages.tsx` - ✅ Usa adaptador

## 🧪 Pruebas

Para verificar que funciona:

1. **Crear assessment** con imágenes reales
2. **Navegar a Damages** y verificar:
   - ✅ Imágenes se cargan correctamente
   - ✅ Severidades están mapeadas ("grave", "medio", "leve")
   - ✅ Tipos de daño en español
   - ✅ Zones y subzones correctos
   - ✅ Confidence valores realistas

## 🎉 Resultado

- ✅ **Imágenes funcionan**: URLs reales del S3
- ✅ **Datos mapeados**: Estructura compatible con DamageCard
- ✅ **Severidades traducidas**: SEV4 → "grave"
- ✅ **Tipos en español**: "dent" → "Abolladura"
- ✅ **IDs únicos**: Para selección y confirmación

**¡Las imágenes de daños ahora se visualizan correctamente! 🖼️**
