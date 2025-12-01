/**
 * Quick test for diagnosis API
 * Run this in browser console after logging in
 *
 * Usage:
 *   In browser console, run: quickDiagnosisTest()
 *   Or with a specific diagnosis: quickDiagnosisTest('existing-diagnosis-id', 'existing-car-id')
 */

export async function quickDiagnosisTest(existingDiagnosisId?: string, existingCarId?: string) {
    console.log('%c🔍 QUICK DIAGNOSIS API TEST', 'color: #2196F3; font-size: 18px; font-weight: bold');
    console.log('==========================================');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No hay token. Por favor inicia sesión primero.');
        return { success: false, error: 'No token' };
    }
    console.log('✅ Token encontrado');

    const baseURL = 'https://motormind-backend-development.up.railway.app/api/v1';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const results: Record<string, any> = {};

    try {
        // Use dynamic import for axios
        const axios = await import('axios').then(m => m.default);

        let carId = existingCarId;
        let diagnosisId = existingDiagnosisId;

        // If no existing IDs, create new ones
        if (!carId || !diagnosisId) {
            // Step 1: Get/Create vehicle
            console.log('\n1️⃣ Obteniendo/creando vehículo...');
            const testPlate = `TEST-${Date.now().toString().slice(-4)}`;

            try {
                const vehicleRes = await axios.get(`${baseURL}/cars/vin-or-plate`, {
                    params: { plate: testPlate },
                    headers,
                    timeout: 15000
                });
                carId = vehicleRes.data._id;
                console.log('✅ Vehículo obtenido:', carId);
                console.log('   Marca:', vehicleRes.data.brand);
                console.log('   Modelo:', vehicleRes.data.model);
                results.vehicle = { success: true, carId, plate: testPlate };
            } catch (err: any) {
                console.error('❌ Error obteniendo vehículo:', err.response?.data || err.message);
                results.vehicle = { success: false, error: err.response?.data || err.message };
                return results;
            }

            // Step 2: Create diagnosis
            console.log('\n2️⃣ Creando diagnóstico...');
            try {
                const diagnosisRes = await axios.post(
                    `${baseURL}/cars/${carId}/questions`,
                    {
                        fault: 'TEST: El motor no arranca',
                        notes: 'Test rápido de Carretera'
                    },
                    { headers, timeout: 30000 }
                );
                diagnosisId = diagnosisRes.data._id;
                console.log('✅ Diagnóstico creado:', diagnosisId);
                console.log('   Preguntas generadas:', diagnosisRes.data.questions?.length || 0);
                results.diagnosis = {
                    success: true,
                    diagnosisId,
                    questions: diagnosisRes.data.questions?.length
                };
            } catch (err: any) {
                console.error('❌ Error creando diagnóstico:', err.response?.data || err.message);
                results.diagnosis = { success: false, error: err.response?.data || err.message };
                return results;
            }
        } else {
            console.log('📋 Usando IDs existentes:');
            console.log('   carId:', carId);
            console.log('   diagnosisId:', diagnosisId);
        }

        // Step 3: Save answers
        console.log('\n3️⃣ Guardando respuestas...');
        try {
            const answersRes = await axios.put(
                `${baseURL}/cars/${carId}/diagnosis/${diagnosisId}/answers`,
                { answers: 'No arranca|Desde esta mañana|Sí, suena click|No hay luces' },
                { headers, timeout: 15000 }
            );
            console.log('✅ Respuestas guardadas');
            console.log('   Status del diagnóstico:', answersRes.data.status);
            results.answers = { success: true };
        } catch (err: any) {
            console.error('❌ Error guardando respuestas:', err.response?.status, err.response?.data || err.message);
            results.answers = { success: false, error: err.response?.data || err.message };
            // Continue anyway to test preliminary
        }

        // Step 4: Generate preliminary (the key test!)
        console.log('\n4️⃣ 🎯 GENERANDO DIAGNÓSTICO PRELIMINAR...');
        console.log('   URL:', `${baseURL}/cars/${carId}/diagnosis/${diagnosisId}/preliminary`);
        try {
            const startTime = Date.now();
            const preliminaryRes = await axios.post(
                `${baseURL}/cars/${carId}/diagnosis/${diagnosisId}/preliminary`,
                { obdCodes: [] },
                { headers, timeout: 120000 } // 2 min timeout for AI
            );
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            console.log(`✅ Pre-diagnóstico generado en ${elapsed}s`);

            const preliminary = preliminaryRes.data.preliminary;
            if (preliminary?.possibleReasons?.length) {
                console.log('   Posibles causas:', preliminary.possibleReasons.length);
                preliminary.possibleReasons.slice(0, 2).forEach((r: any, i: number) => {
                    console.log(`   ${i + 1}. ${r.title} (${r.probability})`);
                });
            } else {
                console.log('   ⚠️ No se generaron posibles causas');
            }

            results.preliminary = {
                success: true,
                elapsed: `${elapsed}s`,
                possibleReasons: preliminary?.possibleReasons?.length || 0
            };

        } catch (err: any) {
            console.error('❌ Error generando preliminar:', err.response?.status, err.response?.data || err.message);
            results.preliminary = {
                success: false,
                status: err.response?.status,
                error: err.response?.data || err.message
            };
        }

        // Summary
        console.log('\n📊 RESUMEN:');
        console.table(results);

        const allPassed = Object.values(results).every((r: any) => r.success);
        if (allPassed) {
            console.log('%c✅ TODO FUNCIONA CORRECTAMENTE', 'color: #4CAF50; font-size: 16px; font-weight: bold');
        } else {
            console.log('%c⚠️ ALGUNOS TESTS FALLARON', 'color: #FF9800; font-size: 16px; font-weight: bold');
        }

        return results;

    } catch (error: any) {
        console.error('❌ Error general:', error);
        return { success: false, error: error.message };
    }
}

// For existing diagnosis test
export async function testExistingDiagnosis(diagnosisId: string) {
    console.log('%c🔍 TEST DIAGNÓSTICO EXISTENTE', 'color: #2196F3; font-size: 18px; font-weight: bold');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No hay token');
        return;
    }

    const baseURL = 'https://motormind-backend-development.up.railway.app/api/v1';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const axios = await import('axios').then(m => m.default);

        // Get diagnosis info
        console.log('\n1️⃣ Obteniendo diagnóstico...');
        const diagRes = await axios.get(`${baseURL}/cars/diagnosis/${diagnosisId}`, { headers });
        console.log('✅ Diagnóstico encontrado:');
        console.log('   ID:', diagRes.data._id);
        console.log('   Car ID:', diagRes.data.car?._id);
        console.log('   Fault:', diagRes.data.fault);
        console.log('   Status:', diagRes.data.status);
        console.log('   Questions:', diagRes.data.questions?.length);
        console.log('   Answers:', diagRes.data.answers);
        console.log('   Has preliminary:', !!diagRes.data.preliminary);

        if (diagRes.data.preliminary?.possibleReasons) {
            console.log('   Possible reasons:', diagRes.data.preliminary.possibleReasons.length);
        }

        const carId = diagRes.data.car?._id;
        if (!carId) {
            console.error('❌ No car ID found in diagnosis');
            return;
        }

        // Try to generate preliminary
        console.log('\n2️⃣ Intentando generar preliminary...');
        try {
            const prelimRes = await axios.post(
                `${baseURL}/cars/${carId}/diagnosis/${diagnosisId}/preliminary`,
                { obdCodes: [] },
                { headers, timeout: 120000 }
            );
            console.log('✅ Preliminary generado!');
            console.log('   Possible reasons:', prelimRes.data.preliminary?.possibleReasons?.length || 0);
        } catch (err: any) {
            console.error('❌ Error:', err.response?.status, err.response?.data || err.message);
        }

    } catch (error: any) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

// Auto-register in window
if (typeof window !== 'undefined') {
    (window as any).quickDiagnosisTest = quickDiagnosisTest;
    (window as any).testExistingDiagnosis = testExistingDiagnosis;
    console.log('%c💡 Tests disponibles:', 'color: #4CAF50; font-size: 14px;');
    console.log('   quickDiagnosisTest() - Test completo (crea vehículo y diagnóstico)');
    console.log('   testExistingDiagnosis("diagnosisId") - Test con diagnóstico existente');
}
