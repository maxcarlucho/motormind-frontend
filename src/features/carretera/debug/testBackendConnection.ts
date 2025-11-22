/**
 * Debug utility to test backend connection and API format
 */

import damageAssessmentApi from '@/service/damageAssessmentApi.service';
import axios from 'axios';

export async function testBackendConnection() {
    console.log('🔍 Testing Backend Connection...');
    console.log('==================================');

    // 1. Check if backend is reachable
    try {
        console.log('📡 Testing backend URL: https://motormind-backend-development.up.railway.app/api/v1');
        const response = await axios.get('https://motormind-backend-development.up.railway.app/api/v1/health').catch(() => null);
        if (response) {
            console.log('✅ Backend is reachable');
        } else {
            console.log('⚠️ Backend health check failed, but might still work');
        }
    } catch (error) {
        console.log('❌ Cannot reach backend');
    }

    // 2. Check authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No authentication token found in localStorage');
        console.log('Please login first to get a token');
        return false;
    } else {
        console.log('✅ Auth token found:', token.substring(0, 20) + '...');
    }

    // 3. Test damage assessment intake API
    console.log('\n📋 Testing damage-assessments/intakes API...');

    const testData = {
        vehicleInfo: {
            plate: 'TEST-123',
            brand: 'Test Brand',
            model: 'Test Model',
            year: 2024
        },
        description: 'Test symptom from Carretera',
        images: []
    };

    console.log('Request payload:', JSON.stringify(testData, null, 2));

    try {
        const intakeResponse = await damageAssessmentApi.intake(testData);
        console.log('✅ API call successful!');
        console.log('Response:', intakeResponse);
        console.log('Diagnosis ID:', intakeResponse.id);
        return true;
    } catch (error: any) {
        console.error('❌ API call failed');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);

            // Specific error handling
            if (error.response.status === 401) {
                console.error('🔐 Authentication error - Token might be expired');
                console.log('Try logging in again');
            } else if (error.response.status === 400) {
                console.error('📝 Bad request - Check the data format');
                console.log('Expected format might be different');
            } else if (error.response.status === 404) {
                console.error('🔍 Endpoint not found');
                console.log('The /damage-assessments/intakes endpoint might not exist');
            } else if (error.response.status === 500) {
                console.error('💥 Server error');
                console.log('Backend server has an internal error');
            }
        } else if (error.request) {
            console.error('📡 No response from server');
            console.error('Request was made but no response received');
            console.log('Check if the backend is running');
        } else {
            console.error('⚠️ Error setting up the request');
            console.error('Error:', error.message);
        }

        return false;
    }
}

// Also test what format the API expects by trying different variations
export async function testAPIFormats() {
    console.log('\n🧪 Testing different API formats...');

    const formats = [
        // Format 1: Current format
        {
            name: 'Current format (vehicleInfo object)',
            data: {
                vehicleInfo: {
                    plate: 'TEST-123'
                },
                description: 'Test symptom',
                images: []
            }
        },
        // Format 2: Flat structure
        {
            name: 'Flat structure',
            data: {
                plate: 'TEST-123',
                description: 'Test symptom',
                images: []
            }
        },
        // Format 3: Just description
        {
            name: 'Just description',
            data: {
                description: 'Test symptom'
            }
        },
        // Format 4: Empty object
        {
            name: 'Empty object',
            data: {}
        }
    ];

    for (const format of formats) {
        console.log(`\nTrying format: ${format.name}`);
        console.log('Data:', JSON.stringify(format.data, null, 2));

        try {
            const response = await damageAssessmentApi.intake(format.data);
            console.log(`✅ Format "${format.name}" worked!`);
            console.log('Response ID:', response.id);
            return format.data; // Return the working format
        } catch (error: any) {
            console.log(`❌ Format "${format.name}" failed`);
            if (error.response?.data) {
                console.log('Error:', error.response.data);
            }
        }
    }

    return null;
}

// Run the test
export function runBackendTest() {
    testBackendConnection().then(success => {
        if (!success) {
            console.log('\n🔄 Trying different API formats...');
            testAPIFormats().then(workingFormat => {
                if (workingFormat) {
                    console.log('\n✅ Found working format:', workingFormat);
                } else {
                    console.log('\n❌ No format worked. Backend might be down or API changed.');
                }
            });
        }
    });
}