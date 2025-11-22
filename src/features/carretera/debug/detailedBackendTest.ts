/**
 * Detailed backend test to diagnose connection issues
 */

import axios from 'axios';
import damageAssessmentApi from '@/service/damageAssessmentApi.service';

export async function detailedBackendTest() {
    console.log('%c🔍 DETAILED BACKEND TEST', 'color: #2196F3; font-size: 20px; font-weight: bold;');
    console.log('========================================');

    const results: any = {
        timestamp: new Date().toISOString(),
        token: null,
        backendUrl: null,
        healthCheck: null,
        intakeTest: null,
        recommendations: []
    };

    // 1. Check Token
    console.log('\n1️⃣ Checking authentication token...');
    const token = localStorage.getItem('token');
    if (token) {
        results.token = {
            exists: true,
            length: token.length,
            preview: token.substring(0, 30) + '...'
        };
        console.log('✅ Token found:', results.token.preview);

        // Decode token to check expiry (if JWT)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp ? new Date(payload.exp * 1000) : null;
            const isExpired = expiry ? expiry < new Date() : false;
            results.token.expiry = expiry;
            results.token.isExpired = isExpired;

            if (isExpired) {
                console.warn('⚠️ Token is expired!');
                results.recommendations.push('Token expired - Please login again');
            }
        } catch (e) {
            console.log('Token is not JWT or cannot be decoded');
        }
    } else {
        results.token = { exists: false };
        console.error('❌ No token found!');
        results.recommendations.push('No token - Please login first');
    }

    // 2. Check Backend URL
    console.log('\n2️⃣ Checking backend URL configuration...');
    const backendUrl = 'https://motormind-backend-development.up.railway.app/api/v1';
    results.backendUrl = backendUrl;
    console.log('📍 Backend URL:', backendUrl);

    // 3. Direct Health Check
    console.log('\n3️⃣ Testing direct connection to backend...');
    try {
        const healthResponse = await axios.get(`${backendUrl}/health`, {
            timeout: 5000,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        results.healthCheck = {
            success: true,
            status: healthResponse.status,
            data: healthResponse.data
        };
        console.log('✅ Health check successful:', healthResponse.data);
    } catch (error: any) {
        results.healthCheck = {
            success: false,
            error: error.message,
            status: error.response?.status
        };
        console.warn('⚠️ Health check failed (may be normal if endpoint doesn\'t exist)');
    }

    // 4. Test Intake Endpoint
    console.log('\n4️⃣ Testing damage-assessments/intakes endpoint...');

    // Test variations
    const testVariations = [
        {
            name: 'Empty object',
            data: {}
        },
        {
            name: 'Just description',
            data: { description: 'Test symptom' }
        },
        {
            name: 'With vehicleInfo',
            data: {
                vehicleInfo: { plate: 'TEST-123' },
                description: 'Test symptom'
            }
        },
        {
            name: 'Full data',
            data: {
                vehicleInfo: { plate: 'TEST-123' },
                description: 'Test symptom',
                images: []
            }
        }
    ];

    for (const variation of testVariations) {
        console.log(`\n   Testing variation: ${variation.name}`);
        console.log('   Data:', JSON.stringify(variation.data));

        try {
            const response = await damageAssessmentApi.intake(variation.data as any);
            results.intakeTest = {
                success: true,
                workingFormat: variation.name,
                data: variation.data,
                responseId: response.id
            };
            console.log(`   ✅ SUCCESS! Got ID: ${response.id}`);
            console.log('   Full response:', response);
            break; // Stop on first success
        } catch (error: any) {
            console.log(`   ❌ Failed:`, error.response?.status || error.message);

            if (error.response) {
                console.log('   Response data:', error.response.data);

                // Store the last error for analysis
                results.intakeTest = {
                    success: false,
                    lastError: {
                        format: variation.name,
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        headers: error.response.headers
                    }
                };
            }
        }
    }

    // 5. Analysis and Recommendations
    console.log('\n5️⃣ Analysis and Recommendations');
    console.log('========================================');

    if (!results.token.exists) {
        console.error('🔴 CRITICAL: No authentication token');
        console.log('👉 Action: Login at /login');
    } else if (results.token.isExpired) {
        console.error('🔴 CRITICAL: Token expired');
        console.log('👉 Action: Logout and login again');
    }

    if (results.intakeTest?.success) {
        console.log('🟢 Backend is WORKING!');
        console.log('✅ Working format:', results.intakeTest.workingFormat);
        console.log('✅ Use this data structure:', results.intakeTest.data);
    } else if (results.intakeTest?.lastError) {
        const error = results.intakeTest.lastError;
        console.error('🔴 Backend intake endpoint is NOT working');
        console.log('Last error:', error);

        if (error.status === 404) {
            console.log('❌ The endpoint does not exist on the backend');
            console.log('👉 Backend needs to implement: POST /damage-assessments/intakes');
        } else if (error.status === 401) {
            console.log('❌ Authentication failed');
            console.log('👉 Token might be invalid or expired');
        } else if (error.status === 400) {
            console.log('❌ Bad request - API expects different data format');
            console.log('👉 Check with backend team for correct format');
        } else if (error.status === 500) {
            console.log('❌ Backend server error');
            console.log('👉 Backend has internal issues');
        }
    } else {
        console.error('🔴 Could not reach backend at all');
        console.log('👉 Check if backend is deployed and running');
        console.log('👉 URL:', backendUrl);
    }

    // 6. Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('========================================');
    console.table({
        'Has Token': results.token.exists ? '✅' : '❌',
        'Token Valid': results.token.isExpired === false ? '✅' : '❌',
        'Backend Reachable': results.healthCheck?.success || results.intakeTest?.success ? '✅' : '❌',
        'Intake API Works': results.intakeTest?.success ? '✅' : '❌'
    });

    return results;
}

// Auto-register in window for console access
if (typeof window !== 'undefined') {
    (window as any).testBackend = detailedBackendTest;
    console.log('%c💡 Run testBackend() in console for detailed diagnostics', 'color: #4CAF50; font-size: 14px;');
}