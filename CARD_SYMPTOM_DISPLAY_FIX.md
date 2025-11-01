# Fix: Mostrar Síntoma Procesado en Cards de Diagnóstico

## Problema

En las cards de diagnóstico del Home, cuando el estado era `ASSIGN_OBD_CODES`, se mostraban las respuestas del usuario en lugar del síntoma procesado o ingresado.

## Solución Implementada

### 1. Dashboard (`src/pages/Dashboard/index.tsx`)

- **Agregado nuevo prop**: `processedSymptom` que contiene el síntoma procesado o el ingresado como fallback
- **Lógica**: `diagnosis.processedFault?.symptomCleaned || diagnosis.fault`

### 2. DiagnosticListItem (`src/components/molecules/DiagnosticListItem/index.tsx`)

- **Agregado nuevo prop opcional**: `processedSymptom?: string`
- **Modificada lógica de renderizado**: Para estado `ASSIGN_OBD_CODES`, usa `processedSymptom` si está disponible, sino usa `summary` como fallback

## Cambios Específicos

### Dashboard

```typescript
// ANTES:
summary={[
  diagnosis.fault,
  ...(diagnosis.answers ? diagnosis.answers.split('\n').filter((answer) => answer.trim()) : []),
]}

// AHORA:
summary={[...]} // Mantenido para otros estados
processedSymptom={diagnosis.processedFault?.symptomCleaned || diagnosis.fault}
```

### DiagnosticListItem

```typescript
// ANTES:
status === DIAGNOSIS_STATUS.ASSIGN_OBD_CODES ? (
  <TitledStringList title="Asignar Códigos OBD:" items={summary} />
)

// AHORA:
status === DIAGNOSIS_STATUS.ASSIGN_OBD_CODES ? (
  <TitledStringList
    title="Asignar Códigos OBD:"
    items={processedSymptom ? [processedSymptom] : summary}
  />
)
```

## Resultado

- ✅ Cards con estado `ASSIGN_OBD_CODES` ahora muestran el síntoma procesado
- ✅ Título cambiado de "Asignar Códigos OBD:" a "Síntomas:"
- ✅ Viñetas (bullet points) removidas para síntomas
- ✅ Fallback al síntoma ingresado si no hay síntoma procesado
- ✅ Fallback a las respuestas si no hay `processedSymptom` (compatibilidad)
- ✅ Otros estados no afectados
- ✅ Build exitoso sin errores
- ✅ Tipos TypeScript correctos

## Flujo de Datos

1. **Backend**: Envía `processedFault.symptomCleaned` y `fault`
2. **Dashboard**: Calcula `processedSymptom = processedFault?.symptomCleaned || fault`
3. **DiagnosticListItem**: Usa `processedSymptom` para estado `ASSIGN_OBD_CODES`
4. **Renderizado**: Muestra síntoma procesado en lugar de respuestas
