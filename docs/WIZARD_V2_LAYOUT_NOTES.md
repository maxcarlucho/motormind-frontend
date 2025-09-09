# Wizard V2 - Notas de Layout y Diseño

## Objetivo
Implementación del Walking Skeleton para el Wizard V2 de peritajes de daños con maquetado/presentacional completo, sin lógica de negocio nueva ni llamadas reales al backend.

## Componentes Implementados

### Componentes Base

#### PageShell
- **Propósito**: Layout base con fondo gris y contenedores centrados
- **Características**:
  - Fondo gris claro (`bg-gray-50`)
  - Contenedor centrado con `max-w-[1200px]`
  - Slots para header, title, content y footer
  - Footer sticky para barras de herramientas

#### SectionPaper
- **Propósito**: Cards blancas para secciones
- **Características**:
  - Fondo blanco con borde y sombra sutil
  - Título y descripción opcionales
  - Icono opcional
  - Padding consistente (`p-6`)

#### WizardStepper
- **Propósito**: Stepper horizontal con estados
- **Estados**: `inactive`, `active`, `complete`
- **Características**:
  - Pastillas con números o check
  - Conectores con líneas
  - Estados de hover/focus
  - Soporte para navegación por teclado

#### DamageCard
- **Propósito**: Card para mostrar daños detectados
- **Características**:
  - Imagen con aspect ratio video
  - Badge de confianza (porcentaje)
  - Badge de severidad (leve/medio/grave)
  - Estado de selección visual
  - Indicador de confirmación
  - Accesibilidad completa

#### DragZone
- **Propósito**: Zona de drag & drop para imágenes
- **Características**:
  - Área punteada con estados visuales
  - Validación de tipos de archivo
  - Validación de tamaño
  - Límite de archivos
  - Mensajes de error

#### ProgressCard
- **Propósito**: Mostrar progreso de procesamiento
- **Características**:
  - Barra de progreso animada
  - Porcentaje de completado
  - Aria-live para accesibilidad

#### ValuationTable
- **Propósito**: Tablas para la valoración
- **Características**:
  - Usa componentes Table existentes
  - Configuración flexible de columnas
  - Datos formateados

### Páginas del Wizard

#### 1. Intake (Datos Iniciales)
- **Layout**: 2 secciones principales
  - Datos del vehículo (matrícula, siniestro)
  - Subida de imágenes con drag & drop
- **Validación**: Campos obligatorios antes de continuar
- **Grid de imágenes**: Previsualización de archivos seleccionados

#### 2. Damages (Daños)
- **Layout**: Grid responsivo de cards de daños
- **Estados**: Procesamiento con ProgressCard, luego grid de DamageCards
- **Toolbar sticky**: 
  - Contador de confirmados
  - Filtros (solo seguros >85%)
  - Acciones (añadir, confirmar todos, continuar)
- **Interactividad**: Toggle de selección en cada card

#### 3. Operations (Operaciones)
- **Layout**: Lista de operaciones por pieza
- **Aviso importante**: Los tiempos se calculan en valoración
- **Campos por operación**:
  - Información de la pieza y daño
  - Dropdown de operación principal
  - Botón de suplementos
  - Badge "Pendiente de valoración"
- **Nota crítica**: NO se muestran horas en esta pantalla

#### 4. Valuation (Valoración)
- **Layout**: 3 tablas separadas + resumen
- **Tablas**:
  1. **Mano de obra (sin pintura)**: Horas, tarifa, total, fuente
  2. **Pintura**: MO + materiales con unidades y €/unidad
  3. **Recambios**: Referencia, precio unitario, cantidad
- **Resumen**: Grid con totales por categoría
- **Badges de fuente**: Colores diferenciados (Autodata, Override, etc.)

#### 5. Finalize (Finalizar)
- **Layout**: Card centrada con resumen
- **Estado**: Icono de éxito
- **Información**: Matrícula, daños confirmados, estado
- **CTA**: Volver al listado

## Datos Mock

### damages.json
- 5 daños de ejemplo con imágenes de Unsplash
- Severidades variadas (leve, medio, grave)
- Porcentajes de confianza (78% - 95%)

### valuation.json
- **Labor**: 4 operaciones con diferentes fuentes
- **Paint**: 3 trabajos de pintura con materiales
- **Parts**: 2 recambios de ejemplo
- **Totals**: Resumen con €1,431.2 total

## Estados del Wizard

```typescript
export type WizardV2Status =
  | 'processing'     // Detectando daños
  | 'detected'       // Daños detectados
  | 'damages_confirmed' // Daños confirmados
  | 'operations_defined' // Operaciones definidas  
  | 'valuated'       // Valoración completada
  | 'completed'      // Wizard finalizado
  | 'error';         // Error en proceso
```

## Navegación

- **URL Pattern**: `/damage-assessments/:id/wizard-v2?step={step}`
- **Steps**: `intake` | `damages` | `operations` | `valuation` | `finalize`
- **Feature Flag**: `VITE_WIZARD_V2_ENABLED=true`

## Referencias Visuales

### Colores de Severidad
- **Leve**: Verde (`bg-green-100 text-green-800`)
- **Medio**: Amarillo (`bg-yellow-100 text-yellow-800`) 
- **Grave**: Rojo (`bg-red-100 text-red-800`)

### Estados de Stepper
- **Inactive**: Gris con número
- **Active**: Azul con número
- **Complete**: Verde con check

### Badges de Fuente
- **Autodata**: Azul
- **Segment**: Verde
- **Calc**: Púrpura
- **Override**: Naranja
- **No Data**: Rojo

## Accesibilidad

- **ARIA roles**: `button`, `status`, `toolbar`
- **ARIA live**: Para cambios de estado dinámicos
- **Keyboard navigation**: Tab, Enter, Space
- **Focus management**: Anillos de foco visibles
- **Screen readers**: Labels descriptivos

## Consideraciones Técnicas

- **React 19**: Hooks modernos
- **TypeScript**: Tipado estricto
- **Tailwind CSS**: Utility classes
- **Lucide React**: Iconografía
- **Componentes atómicos**: Reutilización máxima

## Próximos Pasos

1. **PR 2**: Conexión backend Intake real
2. **PR 3**: Damages/Operations con endpoints reales
3. **PR 4**: Valuation/Finalize con lógica de negocio
4. **PR 5**: Políticas de re-generación y overrides

## Notas de Implementación

- ✅ Walking skeleton completo con navegación
- ✅ UI replicando capturas de referencia
- ✅ Sin llamadas al backend (solo mocks)
- ✅ Componentes reutilizables del design system
- ✅ Accesibilidad y responsive design
- ✅ Feature flag para activación progresiva
