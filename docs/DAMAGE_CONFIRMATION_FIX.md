# Arreglo de Confirmación de Daños

## 🎯 Problemas Identificados y Resueltos

### **1. ❌ URL con "preview-id" en lugar de ID real**

**Problema:** La URL mostraba `/damage-assessments/preview-id/wizard-v2` en lugar del ID real del assessment.

**Causa:** La página Intake navegaba manualmente con `?step=damages` sin actualizar la URL con el ID real del assessment creado.

**Solución:** 
- ✅ Modificado `startIntake` para retornar el `assessmentId`
- ✅ Navegación correcta con ID real: `/damage-assessments/${assessmentId}/wizard-v2?step=damages`

```typescript
// Antes:
await startIntake({...});
navigate(`?step=damages`, { replace: true });

// Ahora:
const assessmentId = await startIntake({...});
navigate(`/damage-assessments/${assessmentId}/wizard-v2?step=damages`, { replace: true });
```

### **2. ❌ Error al confirmar daños en el backend**

**Problema:** El backend recibía IDs generados por el frontend (`damage_0_carroceria_trasera_...`) en lugar de índices o datos originales.

**Causa:** Los IDs del frontend no coincidían con lo que esperaba el backend.

**Solución:**
- ✅ Creado mapeo bidireccional en `damageAdapter.ts`
- ✅ Agregados metadatos `__originalIndex` y `__originalData` a daños adaptados  
- ✅ Función `mapSelectedDamageIdsToIndices` para convertir IDs frontend → índices backend

```typescript
// Adaptador ahora incluye metadatos:
{
  id: "damage_0_carroceria_trasera_aleta_izquierda_dent",
  zone: "Carroceria trasera",
  // ... otros campos ...
  __originalIndex: 0,              // ✅ Índice original
  __originalData: backendDamage    // ✅ Datos originales del backend
}

// Mapeo reverso al confirmar:
const mappedIndices = mapSelectedDamageIdsToIndices(selectedDamages, adaptedDamagesWithMeta);
await confirmDamages(mappedIndices.map(String));
```

### **3. ❌ Información de daños confirmados no preservada**

**Problema:** Los daños confirmados no se veían en pasos posteriores.

**Causa:** El contexto no mantenía el estado de confirmación entre navegaciones.

**Status:** ⏳ Pendiente - Necesita implementación de persistencia de estado confirmado.

## 🔧 Cambios Técnicos Implementados

### **Archivo: `hooks/useWizardV2.ts`**

```typescript
// startIntake ahora retorna assessmentId
const startIntake = useCallback(async (data: IntakeData): Promise<string> => {
  // ... lógica de creación ...
  return response.id; // ✅ Retorna ID para navegación
}, []);
```

### **Archivo: `pages/Intake.tsx`**

```typescript
// Navegación corregida con ID real
const assessmentId = await startIntake({...});
navigate(`/damage-assessments/${assessmentId}/wizard-v2?step=damages`, { replace: true });
```

### **Archivo: `adapters/damageAdapter.ts`**

```typescript
// Adaptador con metadatos para mapeo reverso
export function adaptBackendDamage(...): Damage & { __originalIndex: number; __originalData: BackendDamage } {
  return {
    // ... campos normales ...
    __originalIndex: index,
    __originalData: backendDamage
  };
}

// Función de mapeo reverso
export function mapSelectedDamageIdsToIndices(
  selectedIds: string[],
  adaptedDamages: (Damage & { __originalIndex: number; __originalData: BackendDamage })[]
): number[] {
  return selectedIds.map(id => {
    const adaptedDamage = adaptedDamages.find(d => d.id === id);
    return adaptedDamage?.__originalIndex;
  }).filter(index => index !== undefined) as number[];
}
```

### **Archivo: `pages/Damages.tsx`**

```typescript
// Lógica de confirmación con mapeo correcto
const confirmSelected = async () => {
  if (adaptedDamagesWithMeta) {
    const mappedIndices = mapSelectedDamageIdsToIndices(selectedDamages, adaptedDamagesWithMeta);
    await confirmDamages(mappedIndices.map(String));
  } else {
    await confirmDamages(selectedDamages); // Fallback para mocks
  }
  navigate(`?step=operations`, { replace: true });
};
```

## 🧪 Flujo de Prueba

1. **Crear Assessment**: ✅ URL correcta con ID real
2. **Visualizar Daños**: ✅ Imágenes y datos mapeados correctamente  
3. **Confirmar Daños**: ✅ IDs mapeados a índices del backend
4. **Navegación**: ✅ Mantiene URL con ID real entre pasos

## 📋 Archivos Modificados

1. `src/features/damage-wizard-v2/hooks/useWizardV2.ts` - ✅ startIntake retorna ID
2. `src/features/damage-wizard-v2/pages/Intake.tsx` - ✅ Navegación con ID real
3. `src/features/damage-wizard-v2/adapters/damageAdapter.ts` - ✅ Mapeo bidireccional
4. `src/features/damage-wizard-v2/pages/Damages.tsx` - ✅ Confirmación con mapeo
5. `src/features/damage-wizard-v2/api/adapter.ts` - ✅ Logging mejorado

## ✅ Resultados

- ✅ **URL corregida**: Usa ID real del assessment 
- ✅ **Backend funcional**: Recibe índices correctos para confirmar daños
- ✅ **Mapeo bidireccional**: Frontend ↔ Backend sin pérdida de datos
- ✅ **Logging completo**: Debug info para troubleshooting
- ⏳ **Pendiente**: Persistencia de estado confirmado entre pasos

**¡La confirmación de daños ahora funciona correctamente! 🎉**
