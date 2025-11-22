/**
 * Utility to clean duplicate cases from localStorage
 */
export function cleanDuplicateCases() {
    try {
        // Clean operator cases
        const operatorCases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
        const uniqueCases = new Map();

        // Keep only the most recent version of each case
        operatorCases.forEach((caseItem: any) => {
            const existingCase = uniqueCases.get(caseItem.vehiclePlate + caseItem.symptom);
            if (!existingCase || new Date(caseItem.createdAt) > new Date(existingCase.createdAt)) {
                uniqueCases.set(caseItem.vehiclePlate + caseItem.symptom, caseItem);
            }
        });

        const cleanedCases = Array.from(uniqueCases.values());
        localStorage.setItem('carretera_operator_cases', JSON.stringify(cleanedCases));

        console.log(`Cleaned ${operatorCases.length - cleanedCases.length} duplicate cases`);
        return cleanedCases.length;
    } catch (error) {
        console.error('Error cleaning duplicate cases:', error);
        return 0;
    }
}

/**
 * Clear all Carretera data from localStorage
 */
export function clearCarreteraData() {
    const keysToRemove = [
        'carretera_operator_cases',
        'carretera_client_cases',
        'carretera_gruista_cases',
        'carretera_workshop_cases',
        'carretera_case_count'
    ];

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });

    console.log('Cleared all Carretera data from localStorage');
}