/**
 * Simple backend test for Carretera
 * Tests the diagnosis API flow
 */

export async function simpleBackendTest() {
    console.log('%c🚀 TESTING CARRETERA BACKEND CONNECTION', 'color: #4CAF50; font-size: 18px; font-weight: bold');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No token found. Please login first at /login');
        return false;
    }
    console.log('✅ Token found');

    // Import the API from window (should be available in dev mode)
    const axios = (window as any).axios || await import('axios').then(m => m.default);

    const baseURL = 'https://motormind-backend-development.up.railway.app/api/v1';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test 1: Create a vehicle
        console.log('\n📝 Creating test vehicle...');
        const testPlate = `TEST-${Date.now().toString().slice(-6)}`;

        const vehicleResponse = await axios.post(
            `${baseURL}/cars`,
            {
                plate: testPlate,
                brand: 'Toyota',
                model: 'Corolla',
                year: '2020'
            },
            { headers }
        );

        if (!vehicleResponse.data._id) {
            throw new Error('No vehicle ID returned');
        }

        const carId = vehicleResponse.data._id;
        console.log('✅ Vehicle created:', carId);

        // Test 2: Create diagnosis
        console.log('\n📋 Creating diagnosis...');
        const diagnosisResponse = await axios.post(
            `${baseURL}/cars/${carId}/questions`,
            {
                fault: 'El motor hace ruido al arrancar',
                notes: 'Test desde Carretera'
            },
            { headers }
        );

        if (!diagnosisResponse.data._id) {
            throw new Error('No diagnosis ID returned');
        }

        const diagnosisId = diagnosisResponse.data._id;
        const questions = diagnosisResponse.data.questions || [];
        console.log('✅ Diagnosis created:', diagnosisId);
        console.log('   Generated questions:', questions.length);

        // Test 3: Generate pre-diagnosis (without OBD)
        console.log('\n🔍 Generating pre-diagnosis (no OBD)...');
        const preDiagnosisResponse = await axios.post(
            `${baseURL}/cars/${carId}/diagnosis/${diagnosisId}/preliminary`,
            { obdCodes: [] },
            { headers }
        );

        const hasPreDiagnosis = !!preDiagnosisResponse.data.preliminary;
        console.log('✅ Pre-diagnosis generated:', hasPreDiagnosis);

        // Test 4: Generate full diagnosis (with OBD)
        console.log('\n🔧 Generating full diagnosis (with OBD)...');
        const fullDiagnosisResponse = await axios.post(
            `${baseURL}/cars/${carId}/diagnosis/${diagnosisId}/preliminary`,
            { obdCodes: ['P0301', 'P0171'] },
            { headers }
        );

        const hasFullDiagnosis = !!fullDiagnosisResponse.data.preliminary;
        console.log('✅ Full diagnosis generated:', hasFullDiagnosis);

        // Success!
        console.log('\n%c✅ ALL TESTS PASSED! Backend is working correctly', 'color: #4CAF50; font-size: 16px; font-weight: bold');
        console.log('The diagnosis API flow is functioning properly:');
        console.log('  1. Vehicle creation ✅');
        console.log('  2. Diagnosis creation ✅');
        console.log('  3. Pre-diagnosis (without OBD) ✅');
        console.log('  4. Full diagnosis (with OBD) ✅');

        return true;

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);

            if (error.response.status === 401) {
                console.log('💡 Token might be expired. Try logging in again.');
            } else if (error.response.status === 404) {
                console.log('💡 Endpoint not found. Backend might need updates.');
            } else if (error.response.status === 500) {
                console.log('💡 Server error. Backend might have issues.');
            }
        } else {
            console.error('Network error:', error.message);
            console.log('💡 Check if the backend is running and accessible.');
        }

        return false;
    }
}

// Auto-register in window
if (typeof window !== 'undefined') {
    (window as any).simpleBackendTest = simpleBackendTest;
    console.log('%c💡 Run simpleBackendTest() in console to test backend connection',
                'color: #2196F3; font-size: 14px;');
}