/**
 * Adaptadores simplificados para transformar datos entre frontend y backend
 * Solo incluye las funciones que realmente se necesitan
 */
type BackendIntakePayload = {
    vehicleInfo: {
        plate: string;
    };
    images: string[];
    description: string;
};

type BackendConfirmDamagesPayload = {
    confirmedDamageIds: string[];
    edits: Array<{ damageId: string; changes: Record<string, unknown> }>;
};

/**
 * Prepara payload de intake para el backend
 */
export const prepareIntakePayload = (data: {
    plate: string;
    claimDescription: string;
    images: string[];
}): BackendIntakePayload => {
    return {
        vehicleInfo: {
            plate: data.plate,
        },
        images: data.images,
        description: data.claimDescription,
    };
};

/**
 * Prepara payload de confirmación de daños para el backend
 */
export const prepareConfirmDamagesPayload = (
    confirmedDamageIds: string[],
    edits?: Array<{ damageId: string; changes: Record<string, unknown> }>
): BackendConfirmDamagesPayload => {
    console.log('🔄 Preparing confirm damages payload:', {
        confirmedDamageIds,
        edits: edits || []
    });

    return {
        confirmedDamageIds,
        edits: edits || [],
    };
};
