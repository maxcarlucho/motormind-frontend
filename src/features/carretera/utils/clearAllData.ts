/**
 * Utility to completely clear all Carretera data and start fresh
 */

export function clearAllCarreteraData() {
    console.log('🧹 Clearing all Carretera data...');

    const keysToRemove = [
        'carretera_operator_cases',
        'carretera_client_cases',
        'carretera_gruista_cases',
        'carretera_workshop_cases',
        'carretera_case_count'
    ];

    keysToRemove.forEach(key => {
        const hadData = localStorage.getItem(key) !== null;
        localStorage.removeItem(key);
        if (hadData) {
            console.log(`✅ Cleared: ${key}`);
        }
    });

    console.log('🎉 All Carretera data has been cleared!');
    console.log('Refresh the page to start fresh.');
}

// Auto-execute this function to clear on load (TEMPORARY)
// Remove this line after cleaning
if (typeof window !== 'undefined') {
    // Only clear if there are duplicates
    const cases = JSON.parse(localStorage.getItem('carretera_operator_cases') || '[]');
    const ids = cases.map((c: any) => c.id);
    const hasDuplicates = ids.length !== new Set(ids).size;

    if (hasDuplicates) {
        console.warn('⚠️ Duplicate cases detected! Clearing all data...');
        clearAllCarreteraData();
    }
}

// Export for use in console
if (typeof window !== 'undefined') {
    (window as any).clearCarretera = clearAllCarreteraData;
    console.log('💡 TIP: Run "clearCarretera()" in console to clear all data');
}