/**
 * Servicio de Recomendación IA para Gruista
 *
 * Este servicio genera recomendaciones contextualizadas para el gruista
 * basadas en el pre-diagnóstico de Motormind y las respuestas del cliente.
 *
 * Reemplaza la lógica hardcoded de determineRecommendation() con IA real.
 */

import { PossibleReason } from '../types/carretera.types';
import { ApiService } from '@/service/api.service';

// ============================================================================
// TIPOS
// ============================================================================

export interface GruistaRecommendationInput {
    // Datos del vehículo
    vehiclePlate: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    vehicleYear?: number;

    // Síntoma y ubicación
    symptom: string;
    location?: string;

    // Q&A del cliente
    questions: string[];
    answers: string[];

    // Pre-diagnóstico de Motormind
    possibleReasons: PossibleReason[];

    // Contexto adicional
    clientName?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    isHighway?: boolean;
}

export interface GruistaRecommendationOutput {
    recommendation: 'repair' | 'tow';
    confidence: number; // 0-100
    summary: string; // Resumen corto para el gruista (máx 80 chars)
    reasoning: string[]; // Razones de la recomendación
    actionSteps: string[]; // Pasos a seguir si elige esta opción
    risks: string[]; // Riesgos si falla el intento
    estimatedTime: '15-30 min' | '45-60 min' | '>1 hora';
    alternativeConsideration: string; // Qué considerar si la situación cambia
}

// ============================================================================
// PROMPT DEL AGENTE
// ============================================================================

const GRUISTA_RECOMMENDATION_PROMPT = `
Eres un experto en asistencia vehicular en carretera con 20 años de experiencia en Toledo, España. Tu trabajo es analizar un pre-diagnóstico y recomendar al gruista si debe REPARAR IN-SITU o REMOLCAR AL TALLER.

## CONTEXTO DE OPERACIÓN
- Ubicación: Toledo, España (clima mediterráneo continental: veranos >40°C, inviernos fríos)
- Servicio: Asistencia en carretera 24/7 de Bonilla Motor
- El cliente está VARADO esperando junto al vehículo
- Herramientas del gruista: llave inglesa, destornilladores (plano/cruz), multímetro, cables de arranque, pinzas, cargador de batería portátil, fusibles universales, cinta aislante, bridas

## DATOS DEL CASO
- Vehículo: {{vehicleBrand}} {{vehicleModel}} ({{vehicleYear}})
- Matrícula: {{vehiclePlate}}
- Síntoma reportado: {{symptom}}
- Ubicación: {{location}}
- Momento del día: {{timeOfDay}}
{{#if isHighway}}- ⚠️ VEHÍCULO EN AUTOVÍA/AUTOPISTA{{/if}}

## RESPUESTAS DEL CLIENTE
{{clientQA}}

## PRE-DIAGNÓSTICO MOTORMIND
{{diagnosisDetails}}

## TU TAREA
Analiza toda la información y genera una recomendación estructurada.

## CRITERIOS DE DECISIÓN

### Recomendar REPAIR (🟢 Reparar In-Situ) cuando:
- Problema eléctrico simple: batería descargada, fusible fundido, conexión suelta, luces/intermitentes
- Problema menor: neumático pinchado (si hay rueda de repuesto), líquido de refrigerante bajo (si hay para rellenar)
- Probabilidad "Alta" del diagnóstico + herramientas básicas son suficientes
- Tiempo estimado < 45 minutos
- Bajo riesgo de empeorar el problema
- Cliente en ubicación segura (no en arcén de autovía)

### Recomendar TOW (🔴 Remolcar al Taller) cuando:
- Problema mecánico complejo: motor, transmisión, embrague, dirección, frenos
- Requiere elevador, escáner OBD avanzado, o piezas de repuesto
- Probabilidad "Baja" o múltiples causas posibles con misma probabilidad
- Riesgo de daño mayor si se intenta reparar (ej: sobrecalentamiento del motor)
- Cliente en ubicación peligrosa: arcén de autovía, noche sin iluminación, condiciones meteorológicas adversas
- Tiempo estimado > 1 hora
- El cliente menciona ruidos metálicos, humo, olores a quemado

## REGLAS CRÍTICAS
1. SEGURIDAD PRIMERO: Si hay CUALQUIER duda sobre la seguridad, recomienda REMOLCAR
2. En AUTOVÍA/AUTOPISTA: Siempre preferir REMOLCAR a menos que sea algo instantáneo (<10 min)
3. De NOCHE: Aumentar umbral de precaución, preferir REMOLCAR
4. Sé CONCISO: El gruista lee esto en su móvil mientras conduce
5. ACCIONES ESPECÍFICAS: Los pasos deben ser ejecutables, no genéricos

## FORMATO DE RESPUESTA (JSON)
{
  "recommendation": "repair" | "tow",
  "confidence": 0-100,
  "summary": "Resumen de 1 línea para el gruista (máximo 80 caracteres)",
  "reasoning": [
    "Razón 1 específica y concisa",
    "Razón 2",
    "Razón 3"
  ],
  "actionSteps": [
    "Paso 1 concreto si elige esta opción",
    "Paso 2",
    "Paso 3"
  ],
  "risks": [
    "Riesgo 1 si falla el intento o si la situación empeora",
    "Riesgo 2"
  ],
  "estimatedTime": "15-30 min" | "45-60 min" | ">1 hora",
  "alternativeConsideration": "Qué debería hacer el gruista si la situación cambia"
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional antes o después.
`;

// ============================================================================
// FEW-SHOT EXAMPLES
// ============================================================================

const FEW_SHOT_EXAMPLES = [
    // Ejemplo 1: Batería descargada - REPAIR
    {
        input: {
            symptom: "El coche no arranca",
            vehicleBrand: "Seat",
            vehicleModel: "León",
            vehicleYear: 2019,
            location: "Parking centro comercial Luz del Tajo",
            timeOfDay: "morning",
            isHighway: false,
            clientQA: [
                { q: "¿El motor arranca o no arranca en absoluto?", a: "No arranca, solo hace click" },
                { q: "¿Hay algún testigo encendido?", a: "Las luces del tablero están muy débiles" },
                { q: "¿El problema ocurrió de repente?", a: "Sí, dejé las luces encendidas toda la noche" },
                { q: "¿Puedes mover el vehículo?", a: "No, está completamente parado" }
            ],
            possibleReasons: [
                {
                    title: "Batería descargada",
                    probability: "Alta",
                    reasonDetails: "Los síntomas (click sin arranque, luces débiles) junto con el antecedente de luces encendidas toda la noche indican descarga total de batería",
                    requiredTools: ["Cables de arranque", "Multímetro"]
                }
            ]
        },
        output: {
            recommendation: "repair",
            confidence: 92,
            summary: "Batería descargada por luces - arranque con pinzas",
            reasoning: [
                "Cliente confirma que dejó luces encendidas toda la noche",
                "Síntomas clásicos de batería: click sin arranque, luces débiles",
                "Vehículo en parking seguro, no hay prisa"
            ],
            actionSteps: [
                "Verificar voltaje de batería con multímetro (debe estar <11.5V)",
                "Conectar pinzas: rojo a positivo del coche, negro a masa del motor",
                "Arrancar vehículo de asistencia, esperar 2-3 minutos",
                "Intentar arranque. Si funciona, dejar motor encendido 15-20 min"
            ],
            risks: [
                "Si no arranca tras 3 intentos, puede ser alternador defectuoso - remolcar",
                "Si batería tiene >5 años, recomendar revisión/cambio en taller"
            ],
            estimatedTime: "15-30 min",
            alternativeConsideration: "Si la batería no mantiene carga tras 20 min de motor encendido, recomendar visita al taller para diagnóstico del sistema de carga"
        }
    },

    // Ejemplo 2: Sobrecalentamiento - TOW
    {
        input: {
            symptom: "Testigo de temperatura encendido y sale humo",
            vehicleBrand: "Volkswagen",
            vehicleModel: "Golf",
            vehicleYear: 2017,
            location: "Arcén A-42 km 58 dirección Madrid",
            timeOfDay: "afternoon",
            isHighway: true,
            clientQA: [
                { q: "¿El motor arranca?", a: "Sí pero lo apagué porque salía mucho humo" },
                { q: "¿Hay testigos encendidos?", a: "Sí, el de temperatura en rojo" },
                { q: "¿El problema fue gradual o de repente?", a: "Empezó gradual, el testigo parpadeaba y luego fijo" },
                { q: "¿Puedes mover el vehículo?", a: "No me atrevo, sale vapor del capó" }
            ],
            possibleReasons: [
                {
                    title: "Sobrecalentamiento del motor",
                    probability: "Alta",
                    reasonDetails: "Testigo de temperatura en rojo con vapor indica sobrecalentamiento severo. Posibles causas: fuga de refrigerante, bomba de agua, termostato bloqueado",
                    requiredTools: ["Escáner OBD", "Refrigerante", "Herramientas especializadas"]
                },
                {
                    title: "Fuga en el sistema de refrigeración",
                    probability: "Media",
                    reasonDetails: "El vapor puede indicar fuga en manguera, radiador o junta de culata",
                    requiredTools: ["Kit de presión de refrigerante", "Elevador"]
                }
            ]
        },
        output: {
            recommendation: "tow",
            confidence: 95,
            summary: "Sobrecalentamiento severo en autovía - NO arrancar",
            reasoning: [
                "⚠️ Vehículo en arcén de autovía - ubicación peligrosa",
                "Sobrecalentamiento con vapor = posible daño en junta de culata",
                "Arrancar el motor podría causar daño irreversible al motor"
            ],
            actionSteps: [
                "NO intentar arrancar el motor bajo ninguna circunstancia",
                "Activar señalización de emergencia y triángulos",
                "Alejar al cliente del vehículo hacia zona segura (detrás del guardarraíl)",
                "Cargar vehículo en grúa sin intentar moverlo"
            ],
            risks: [
                "Arrancar el motor con sobrecalentamiento puede fundir pistones o dañar culata (reparación >3000€)",
                "Permanecer en arcén de autovía es extremadamente peligroso"
            ],
            estimatedTime: ">1 hora",
            alternativeConsideration: "Si el cliente insiste en intentar algo, solo verificar nivel de refrigerante con motor FRÍO (esperar 30+ min). Si está vacío, NO rellenar ni arrancar."
        }
    },

    // Ejemplo 3: Fusible fundido - REPAIR
    {
        input: {
            symptom: "Las luces no funcionan",
            vehicleBrand: "Renault",
            vehicleModel: "Clio",
            vehicleYear: 2020,
            location: "Calle Comercio, Toledo centro",
            timeOfDay: "evening",
            isHighway: false,
            clientQA: [
                { q: "¿El motor arranca?", a: "Sí, el coche funciona normal pero sin luces" },
                { q: "¿Qué luces no funcionan?", a: "Las delanteras, las de freno sí van" },
                { q: "¿El problema fue de repente?", a: "Sí, de un momento a otro se apagaron" },
                { q: "¿Has cambiado algo recientemente?", a: "No, nada" }
            ],
            possibleReasons: [
                {
                    title: "Fusible de alumbrado fundido",
                    probability: "Alta",
                    reasonDetails: "Fallo súbito de luces delanteras con resto del sistema funcionando indica fusible fundido. Común en el circuito de faros.",
                    requiredTools: ["Fusibles de repuesto", "Manual de fusibles"]
                }
            ]
        },
        output: {
            recommendation: "repair",
            confidence: 88,
            summary: "Fusible de faros fundido - cambio rápido",
            reasoning: [
                "Fallo súbito solo en luces delanteras = patrón típico de fusible",
                "El resto del vehículo funciona correctamente",
                "Ubicación en calle urbana segura"
            ],
            actionSteps: [
                "Localizar caja de fusibles (normalmente bajo volante o en vano motor)",
                "Identificar fusible de faros según manual (Renault Clio: F9 o F10, 15A)",
                "Verificar fusible visualmente o con multímetro",
                "Reemplazar con fusible del mismo amperaje"
            ],
            risks: [
                "Si el fusible nuevo se funde inmediatamente, hay cortocircuito - remolcar",
                "No usar fusible de mayor amperaje (riesgo de incendio)"
            ],
            estimatedTime: "15-30 min",
            alternativeConsideration: "Si no se encuentra el fusible adecuado, el cliente puede circular de día hasta llegar al taller (solo si hay luz natural suficiente)"
        }
    }
];

// ============================================================================
// SERVICIO
// ============================================================================

class GruistaRecommendationService {
    private apiService: ApiService;

    constructor() {
        this.apiService = ApiService.getInstance();
    }

    /**
     * Genera una recomendación contextualizada para el gruista usando IA
     */
    async generateRecommendation(
        input: GruistaRecommendationInput
    ): Promise<GruistaRecommendationOutput> {
        try {
            // Construir el prompt con los datos del caso
            const prompt = this.buildPrompt(input);

            // Llamar al endpoint de IA (asumiendo que existe en el backend)
            // Si no existe, podemos usar la API de OpenAI/Anthropic directamente
            const response = await this.callAI(prompt);

            // Parsear y validar la respuesta
            const recommendation = this.parseResponse(response);

            return recommendation;
        } catch (error) {
            console.error('Error generating gruista recommendation:', error);
            // Fallback a la lógica simple si falla la IA
            return this.fallbackRecommendation(input);
        }
    }

    /**
     * Construye el prompt completo con los datos del caso
     */
    private buildPrompt(input: GruistaRecommendationInput): string {
        // Formatear Q&A del cliente
        const clientQA = input.questions
            .map((q, i) => `P: ${q}\nR: ${input.answers[i] || 'Sin respuesta'}`)
            .join('\n\n');

        // Formatear diagnóstico
        const diagnosisDetails = input.possibleReasons
            .map((reason, i) => `
### Causa ${i + 1}: ${reason.title}
- Probabilidad: ${reason.probability}
- Detalle: ${reason.reasonDetails}
- Herramientas necesarias: ${reason.requiredTools?.join(', ') || 'No especificadas'}
- Recomendaciones: ${reason.diagnosticRecommendations?.join('; ') || 'No especificadas'}
            `.trim())
            .join('\n\n');

        // Determinar momento del día si no viene
        const timeOfDay = input.timeOfDay || this.getTimeOfDay();

        // Reemplazar variables en el prompt
        let prompt = GRUISTA_RECOMMENDATION_PROMPT
            .replace('{{vehicleBrand}}', input.vehicleBrand || 'Desconocido')
            .replace('{{vehicleModel}}', input.vehicleModel || 'Desconocido')
            .replace('{{vehicleYear}}', String(input.vehicleYear || 'Desconocido'))
            .replace('{{vehiclePlate}}', input.vehiclePlate)
            .replace('{{symptom}}', input.symptom)
            .replace('{{location}}', input.location || 'No especificada')
            .replace('{{timeOfDay}}', this.formatTimeOfDay(timeOfDay))
            .replace('{{clientQA}}', clientQA)
            .replace('{{diagnosisDetails}}', diagnosisDetails);

        // Añadir indicador de autovía si aplica
        if (input.isHighway) {
            prompt = prompt.replace('{{#if isHighway}}- ⚠️ VEHÍCULO EN AUTOVÍA/AUTOPISTA{{/if}}', '- ⚠️ VEHÍCULO EN AUTOVÍA/AUTOPISTA');
        } else {
            prompt = prompt.replace('{{#if isHighway}}- ⚠️ VEHÍCULO EN AUTOVÍA/AUTOPISTA{{/if}}', '');
        }

        // Añadir few-shot examples para mejorar consistencia
        const examplesText = this.formatFewShotExamples();

        return `${prompt}\n\n## EJEMPLOS DE REFERENCIA\n${examplesText}`;
    }

    /**
     * Formatea los ejemplos few-shot para el prompt
     */
    private formatFewShotExamples(): string {
        return FEW_SHOT_EXAMPLES.map((example, i) => `
### Ejemplo ${i + 1}: ${example.input.symptom}
**Contexto:** ${example.input.vehicleBrand} ${example.input.vehicleModel} en ${example.input.location}
**Decisión:** ${example.output.recommendation === 'repair' ? '🟢 REPARAR' : '🔴 REMOLCAR'}
**Resumen:** ${example.output.summary}
        `.trim()).join('\n\n');
    }

    /**
     * Llama a la API de IA para generar la recomendación
     */
    private async callAI(prompt: string): Promise<string> {
        // Opción 1: Usar endpoint del backend de Motormind si existe
        try {
            const response = await this.apiService.post<{ response: string }>(
                '/ai/gruista-recommendation',
                { prompt },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.response;
        } catch (backendError) {
            console.log('Backend AI endpoint not available, trying direct API...');
        }

        // Opción 2: Si el backend no tiene endpoint, retornar error para usar fallback
        throw new Error('AI endpoint not available');
    }

    /**
     * Parsea la respuesta de la IA y la valida
     */
    private parseResponse(response: string): GruistaRecommendationOutput {
        // Limpiar la respuesta (a veces viene con texto adicional)
        let jsonStr = response.trim();

        // Buscar el JSON en la respuesta
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonStr);

        // Validar campos requeridos
        if (!parsed.recommendation || !['repair', 'tow'].includes(parsed.recommendation)) {
            throw new Error('Invalid recommendation value');
        }

        // Normalizar y validar
        return {
            recommendation: parsed.recommendation,
            confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
            summary: (parsed.summary || '').slice(0, 80),
            reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.slice(0, 5) : [],
            actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps.slice(0, 5) : [],
            risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3) : [],
            estimatedTime: parsed.estimatedTime || '45-60 min',
            alternativeConsideration: parsed.alternativeConsideration || ''
        };
    }

    /**
     * Fallback a la lógica simple si la IA falla
     * Mantiene compatibilidad con el sistema actual
     */
    private fallbackRecommendation(input: GruistaRecommendationInput): GruistaRecommendationOutput {
        const topReason = input.possibleReasons[0];

        if (!topReason) {
            return {
                recommendation: 'tow',
                confidence: 30,
                summary: 'Sin diagnóstico disponible - remolcar por seguridad',
                reasoning: ['No hay diagnóstico de IA disponible', 'Por seguridad, se recomienda remolcar'],
                actionSteps: ['Cargar vehículo en grúa', 'Transportar al taller más cercano'],
                risks: ['Sin diagnóstico, el problema podría ser grave'],
                estimatedTime: '>1 hora',
                alternativeConsideration: 'Esperar a que el sistema de diagnóstico esté disponible'
            };
        }

        // Lógica simple mejorada
        const requiredTools = topReason.requiredTools || [];
        const simpleTools = ['llave', 'destornillador', 'multímetro', 'cables', 'pinzas', 'batería', 'cargador', 'fusible'];

        const hasSimpleTools = requiredTools.length === 0 || requiredTools.every((tool: string) =>
            simpleTools.some(simple => tool.toLowerCase().includes(simple))
        );

        const isHighRisk = input.isHighway ||
            input.symptom.toLowerCase().includes('humo') ||
            input.symptom.toLowerCase().includes('fuego') ||
            input.symptom.toLowerCase().includes('temperatura');

        // Decidir
        let recommendation: 'repair' | 'tow' = 'tow';
        let confidence = 50;

        if (!isHighRisk && topReason.probability === 'Alta' && hasSimpleTools && requiredTools.length <= 2) {
            recommendation = 'repair';
            confidence = 75;
        } else if (!isHighRisk && topReason.probability === 'Media' && hasSimpleTools && requiredTools.length <= 1) {
            recommendation = 'repair';
            confidence = 60;
        }

        return {
            recommendation,
            confidence,
            summary: recommendation === 'repair'
                ? `${topReason.title} - posible reparación in-situ`
                : `${topReason.title} - requiere taller`,
            reasoning: [topReason.reasonDetails || 'Análisis basado en síntomas reportados'],
            actionSteps: recommendation === 'repair'
                ? ['Verificar diagnóstico en sitio', 'Intentar reparación con herramientas básicas']
                : ['Cargar vehículo', 'Transportar al taller'],
            risks: ['Diagnóstico simplificado - verificar en sitio'],
            estimatedTime: recommendation === 'repair' ? '45-60 min' : '>1 hora',
            alternativeConsideration: 'Si la situación difiere del diagnóstico, reevaluar'
        };
    }

    /**
     * Obtiene el momento del día actual
     */
    private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    /**
     * Formatea el momento del día para el prompt
     */
    private formatTimeOfDay(time: string): string {
        const formats: Record<string, string> = {
            'morning': 'Mañana (6:00-12:00)',
            'afternoon': 'Tarde (12:00-18:00)',
            'evening': 'Atardecer (18:00-22:00)',
            'night': 'Noche (22:00-6:00) ⚠️'
        };
        return formats[time] || time;
    }

    /**
     * Detecta si la ubicación parece ser una autovía
     */
    detectHighway(location: string): boolean {
        if (!location) return false;
        const highwayPatterns = [
            /\bA-\d+/i,      // A-42, A-5, etc.
            /\bAP-\d+/i,    // AP-41
            /\bM-\d+/i,     // M-30, M-40
            /\bN-\d+/i,     // N-401
            /autov[ií]a/i,
            /autopista/i,
            /circunvalaci[oó]n/i,
            /km\s*\d+/i,    // km 58
            /arc[eé]n/i
        ];
        return highwayPatterns.some(pattern => pattern.test(location));
    }
}

// Exportar instancia singleton
export const gruistaRecommendationService = new GruistaRecommendationService();

// Exportar clase para testing
export { GruistaRecommendationService };
