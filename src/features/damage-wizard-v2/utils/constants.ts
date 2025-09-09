/**
 * Constantes y configuración para el Wizard V2
 */

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flag principal para habilitar/deshabilitar wizard v2
 * Controlado por variable de entorno VITE_WIZARD_V2_ENABLED
 */
export const WIZARD_V2_ENABLED = import.meta.env.VITE_WIZARD_V2_ENABLED === 'true';

/**
 * Flag para usar datos mock en lugar de backend real
 * Útil para desarrollo y testing
 */
export const USE_MOCK_DATA = import.meta.env.VITE_WIZARD_V2_USE_MOCK === 'true';

/**
 * Flag para mostrar información de debug en la UI
 */
export const DEBUG_MODE = import.meta.env.VITE_WIZARD_V2_DEBUG === 'true';

// ============================================================================
// CONFIGURACIÓN DE POLLING
// ============================================================================

/**
 * Intervalo de polling para detección de daños (en ms)
 */
export const POLLING_INTERVAL = 3000; // 3 segundos

/**
 * Número máximo de intentos de polling antes de dar error
 */
export const MAX_POLLING_ATTEMPTS = 40; // 2 minutos total

/**
 * Timeout para requests individuales (en ms)
 */
export const REQUEST_TIMEOUT = 15000; // 15 segundos

// ============================================================================
// CONFIGURACIÓN DE UI
// ============================================================================

/**
 * Número máximo de imágenes que se pueden subir
 */
export const MAX_IMAGES = 20;

/**
 * Tamaño máximo por imagen (en bytes)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Formatos de imagen permitidos
 */
export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Tiempo de debounce para búsquedas (en ms)
 */
export const SEARCH_DEBOUNCE = 300;

// ============================================================================
// RUTAS DEL WIZARD
// ============================================================================

/**
 * Pasos del wizard en orden
 */
export const WIZARD_STEPS = ['intake', 'damages', 'operations', 'valuation', 'finalize'] as const;

/**
 * Mapeo de pasos a títulos para mostrar en UI
 */
export const WIZARD_STEP_TITLES = {
  intake: 'Datos iniciales',
  damages: 'Verificar daños',
  operations: 'Definir operaciones',
  valuation: 'Valoración',
  finalize: 'Finalizar',
} as const;

/**
 * Mapeo de pasos a URLs
 */
export const WIZARD_STEP_URLS = {
  intake: 'intake',
  damages: 'damages',
  operations: 'operations',
  valuation: 'valuation',
  finalize: 'finalize',
} as const;

// ============================================================================
// CONFIGURACIÓN DE VALIDACIÓN
// ============================================================================

/**
 * Regex para validar matrícula española
 */
export const PLATE_REGEX = /^[0-9]{4}[BCDFGHJKLMNPQRSTVWXYZ]{3}$/;

/**
 * Longitud mínima para descripción del siniestro
 */
export const MIN_CLAIM_DESCRIPTION_LENGTH = 10;

/**
 * Longitud máxima para descripción del siniestro
 */
export const MAX_CLAIM_DESCRIPTION_LENGTH = 500;

// ============================================================================
// CONFIGURACIÓN DE VALORACIÓN
// ============================================================================

/**
 * Tarifa por defecto de mano de obra (€/hora)
 */
export const DEFAULT_LABOR_RATE = 42;

/**
 * Tarifa por defecto de pintura (€/hora)
 */
export const DEFAULT_PAINT_RATE = 45;

/**
 * Porcentaje de IVA por defecto
 */
export const DEFAULT_TAX_RATE = 0.21; // 21%

/**
 * Moneda por defecto
 */
export const DEFAULT_CURRENCY = 'EUR';

// ============================================================================
// MENSAJES DE ERROR
// ============================================================================

export const ERROR_MESSAGES = {
  // Generales
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado',
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet',
  TIMEOUT_ERROR: 'La operación ha tardado demasiado. Inténtelo de nuevo',
  
  // Validación
  INVALID_PLATE: 'La matrícula debe tener el formato 1234ABC',
  CLAIM_TOO_SHORT: `La descripción debe tener al menos ${MIN_CLAIM_DESCRIPTION_LENGTH} caracteres`,
  CLAIM_TOO_LONG: `La descripción no puede superar ${MAX_CLAIM_DESCRIPTION_LENGTH} caracteres`,
  NO_IMAGES: 'Debe subir al menos una imagen',
  TOO_MANY_IMAGES: `No puede subir más de ${MAX_IMAGES} imágenes`,
  INVALID_IMAGE_FORMAT: 'Formato de imagen no válido. Use JPG, PNG o WebP',
  IMAGE_TOO_LARGE: `La imagen no puede superar ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
  
  // Backend
  ASSESSMENT_NOT_FOUND: 'Peritaje no encontrado',
  PROCESSING_TIMEOUT: 'El análisis de imágenes está tardando más de lo esperado',
  NO_DAMAGES_DETECTED: 'No se han detectado daños en las imágenes',
  INVALID_ASSESSMENT_STATE: 'El estado del peritaje no permite esta operación',
  
  // Datos
  NO_LABOR_DATA: 'No hay datos de mano de obra disponibles para este vehículo',
  NO_PAINT_DATA: 'No hay datos de pintura disponibles',
  NO_PARTS_DATA: 'No hay datos de recambios disponibles',
} as const;

// ============================================================================
// MENSAJES DE ÉXITO
// ============================================================================

export const SUCCESS_MESSAGES = {
  INTAKE_CREATED: 'Peritaje creado correctamente',
  DAMAGES_CONFIRMED: 'Daños confirmados correctamente',
  OPERATIONS_SAVED: 'Operaciones guardadas correctamente',
  VALUATION_GENERATED: 'Valoración generada correctamente',
  ASSESSMENT_FINALIZED: 'Peritaje finalizado correctamente',
} as const;

// ============================================================================
// CONFIGURACIÓN DE LOGGING
// ============================================================================

/**
 * Prefijo para logs del wizard v2
 */
export const LOG_PREFIX = '[WizardV2]';

/**
 * Niveles de log disponibles
 */
export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verifica si el wizard v2 está habilitado
 */
export const isWizardV2Enabled = (): boolean => WIZARD_V2_ENABLED;

/**
 * Verifica si se deben usar datos mock
 */
export const shouldUseMockData = (): boolean => USE_MOCK_DATA;

/**
 * Verifica si el modo debug está activo
 */
export const isDebugMode = (): boolean => DEBUG_MODE;

/**
 * Crea una URL para un paso específico del wizard
 */
export const createWizardUrl = (assessmentId: string, step: keyof typeof WIZARD_STEP_URLS): string => {
  return `/damage-assessments/${assessmentId}/wizard-v2?step=${WIZARD_STEP_URLS[step]}`;
};

/**
 * Extrae el paso actual de la URL
 */
export const extractStepFromUrl = (): keyof typeof WIZARD_STEP_URLS | null => {
  const params = new URLSearchParams(window.location.search);
  const step = params.get('step');
  
  if (step && Object.values(WIZARD_STEP_URLS).includes(step as any)) {
    return Object.keys(WIZARD_STEP_URLS).find(
      key => WIZARD_STEP_URLS[key as keyof typeof WIZARD_STEP_URLS] === step
    ) as keyof typeof WIZARD_STEP_URLS || null;
  }
  
  return null;
};

/**
 * Logger con prefijo para wizard v2
 */
export const logger = {
  error: (message: string, ...args: any[]) => console.error(LOG_PREFIX, message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(LOG_PREFIX, message, ...args),
  info: (message: string, ...args: any[]) => console.info(LOG_PREFIX, message, ...args),
  debug: (message: string, ...args: any[]) => {
    if (isDebugMode()) {
      console.debug(LOG_PREFIX, message, ...args);
    }
  },
};
