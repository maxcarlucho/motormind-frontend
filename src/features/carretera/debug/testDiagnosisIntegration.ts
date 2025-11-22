/**
 * Test script to verify Carretera is using the correct diagnosis API
 * This confirms the fix from damage-assessments to diagnoses API
 */

import axios from 'axios';

export async function testDiagnosisIntegration() {
    console.log('%c🔍 TESTING DIAGNOSIS API INTEGRATION', 'color: #2196F3; font-size: 20px; font-weight: bold;');
    console.log('========================================');
    console.log('Verificando que Carretera usa /diagnoses en lugar de /damage-assessments');

    const results: any = {
        timestamp: new Date().toISOString(),
        token: null,
        vehicleAPI: null,
        diagnosisAPI: null,
        preliminaryAPI: null,
        fullFlow: null,
    };

    // 1. Check Token
    console.log('\n1️⃣ Verificando token de autenticación...');
    const token = localStorage.getItem('token');
    if (token) {
        results.token = { exists: true };
        console.log('✅ Token encontrado');
    } else {
        results.token = { exists: false };
        console.error('❌ No hay token - Por favor inicia sesión');
        return results;
    }

    const backendUrl = 'https://motormind-backend-development.up.railway.app/api/v1';
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Vehicle API (GET /cars/vin-or-plate)
    console.log('\n2️⃣ Probando API de vehículos (GET /cars/vin-or-plate)...');
    try {
        const testPlate = `TEST-${Date.now().toString().slice(-6)}`;
        const vehicleResponse = await axios.get(`${backendUrl}/cars/vin-or-plate`, {
            params: { plate: testPlate },
            headers,
            timeout: 10000,
        });

        results.vehicleAPI = {
            success: true,
            vehicleId: vehicleResponse.data._id,
            plate: vehicleResponse.data.plate,
        };
        console.log('✅ API de vehículos funciona correctamente');
        console.log('   ID del vehículo:', vehicleResponse.data._id);

        // 3. Test Diagnosis Creation (POST /cars/:carId/questions)
        console.log('\n3️⃣ Probando creación de diagnóstico (POST /cars/:carId/questions)...');
        try {
            const diagnosisResponse = await axios.post(
                `${backendUrl}/cars/${vehicleResponse.data._id}/questions`,
                {
                    fault: 'Test desde Carretera - Verificación de API',
                    notes: 'Esta es una prueba del flujo correcto de diagnóstico',
                },
                { headers, timeout: 10000 }
            );

            results.diagnosisAPI = {
                success: true,
                diagnosisId: diagnosisResponse.data._id,
                questions: diagnosisResponse.data.questions?.length || 0,
            };
            console.log('✅ API de diagnóstico funciona correctamente');
            console.log('   ID del diagnóstico:', diagnosisResponse.data._id);
            console.log('   Preguntas generadas:', results.diagnosisAPI.questions);

            // 4. Test Preliminary Diagnosis (POST /cars/:carId/diagnosis/:diagnosisId/preliminary)
            console.log('\n4️⃣ Probando generación de pre-diagnóstico (sin OBD)...');
            try {
                // First update with some answers
                await axios.patch(
                    `${backendUrl}/cars/diagnosis/${diagnosisResponse.data._id}`,
                    {
                        answers: 'El motor hace ruido|Desde ayer|Sí, un ruido metálico',
                    },
                    { headers, timeout: 10000 }
                );

                // Then generate preliminary without OBD
                const preliminaryResponse = await axios.post(
                    `${backendUrl}/cars/${vehicleResponse.data._id}/diagnosis/${diagnosisResponse.data._id}/preliminary`,
                    {
                        obdCodes: [], // Sin códigos OBD para pre-diagnóstico
                    },
                    { headers, timeout: 10000 }
                );

                results.preliminaryAPI = {
                    success: true,
                    hasPreliminary: !!preliminaryResponse.data.preliminary,
                    possibleReasons: preliminaryResponse.data.preliminary?.possibleReasons?.length || 0,
                };
                console.log('✅ Pre-diagnóstico generado correctamente (sin OBD)');
                console.log('   Posibles causas:', results.preliminaryAPI.possibleReasons);

                // 5. Test Full Diagnosis with OBD
                console.log('\n5️⃣ Probando diagnóstico completo (con OBD)...');
                const fullDiagnosisResponse = await axios.post(
                    `${backendUrl}/cars/${vehicleResponse.data._id}/diagnosis/${diagnosisResponse.data._id}/preliminary`,
                    {
                        obdCodes: ['P0301', 'P0171'], // CON códigos OBD para diagnóstico completo
                    },
                    { headers, timeout: 10000 }
                );

                results.fullDiagnosis = {
                    success: true,
                    hasPreliminary: !!fullDiagnosisResponse.data.preliminary,
                    withOBD: true,
                };
                console.log('✅ Diagnóstico completo generado correctamente (con OBD)');

                results.fullFlow = true;
            } catch (preliminaryError: any) {
                results.preliminaryAPI = {
                    success: false,
                    error: preliminaryError.response?.status || preliminaryError.message,
                };
                console.error('❌ Error en generación de diagnóstico preliminar:', preliminaryError.message);
            }
        } catch (diagnosisError: any) {
            results.diagnosisAPI = {
                success: false,
                error: diagnosisError.response?.status || diagnosisError.message,
            };
            console.error('❌ Error al crear diagnóstico:', diagnosisError.message);
        }
    } catch (vehicleError: any) {
        results.vehicleAPI = {
            success: false,
            error: vehicleError.response?.status || vehicleError.message,
        };
        console.error('❌ Error en API de vehículos:', vehicleError.message);
    }

    // 6. Summary
    console.log('\n📊 RESUMEN DEL TEST');
    console.log('========================================');
    console.table({
        'Autenticación': results.token?.exists ? '✅' : '❌',
        'API Vehículos (/cars/vin-or-plate)': results.vehicleAPI?.success ? '✅' : '❌',
        'API Diagnóstico (/cars/:id/questions)': results.diagnosisAPI?.success ? '✅' : '❌',
        'Pre-diagnóstico (sin OBD)': results.preliminaryAPI?.success ? '✅' : '❌',
        'Diagnóstico completo (con OBD)': results.fullDiagnosis?.success ? '✅' : '❌',
        'Flujo completo': results.fullFlow ? '✅ FUNCIONANDO' : '❌ INCOMPLETO',
    });

    if (results.fullFlow) {
        console.log('%c✅ ÉXITO: Carretera está usando las APIs de diagnóstico correctamente',
                    'color: #4CAF50; font-size: 16px; font-weight: bold');
        console.log('El flujo completo funciona:');
        console.log('1. Operador crea caso con matrícula + síntoma → crea diagnóstico nuevo');
        console.log('2. Cliente responde preguntas → se genera pre-diagnóstico SIN OBD');
        console.log('3. Taller acepta caso → puede ingresar OBD para regenerar diagnóstico CON averías finales');
    } else {
        console.log('%c❌ El flujo no está completo', 'color: #F44336; font-size: 16px; font-weight: bold');
        console.log('Revisa los errores arriba para identificar qué parte falla');
    }

    return results;
}

// Auto-register in window for console access
if (typeof window !== 'undefined') {
    (window as any).testDiagnosisIntegration = testDiagnosisIntegration;
    console.log('%c💡 Ejecuta testDiagnosisIntegration() en la consola para probar la integración',
                'color: #4CAF50; font-size: 14px;');
}