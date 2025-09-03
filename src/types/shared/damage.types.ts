/**
 * Tipos de daño centralizados para el frontend
 * Mantiene paridad con el backend para consistencia
 */

// Enums del backend (paridad completa)
export enum DamageSeverity {
    SEV1 = 'SEV1',
    SEV2 = 'SEV2',
    SEV3 = 'SEV3',
    SEV4 = 'SEV4',
    SEV5 = 'SEV5',
}

export enum DamageType {
    SCRATCH = 'scratch',
    DENT = 'dent',
    CRACK = 'crack',
    BREAK = 'break',
    // Tipos específicos de Tchek
    PAINT_PEEL = 'paint_peel',
    DEFORMATION = 'deformation',
    IMPACT = 'impact',
    RUST = 'rust',
    DISLOCATED_PART = 'dislocated_part',
    BROKEN_PART = 'broken_part',
    MISSING_PART = 'missing_part',
    DETACHED_PART = 'detached_part',
    HOLE = 'hole',
    BURN = 'burn',
    CORROSION = 'corrosion',
}

// Mapeo de tipos de daño a descripciones en español
export const damageTypeMap: Record<string, string> = {
    'dent': 'Abolladura',
    'scratch': 'Rayón',
    'broken': 'Pieza rota',
    'broken_part': 'Pieza rota',
    'break': 'Pieza rota',
    'dislocated': 'Desplazamiento',
    'dislocated_part': 'Pieza desplazada',
    'crack': 'Grieta',
    'hole': 'Agujero',
    'burn': 'Quemadura',
    'corrosion': 'Corrosión',
    'paint_peel': 'Desprendimiento de pintura',
    'deformation': 'Deformación',
    'impact': 'Impacto',
    'rust': 'Óxido',
    'missing_part': 'Pieza faltante',
    'detached_part': 'Pieza desprendida',
};

// Función helper para obtener la descripción en español de un tipo de daño
export function getDamageTypeLabel(type: DamageType | string): string {
    return damageTypeMap[type as string] || type;
}
