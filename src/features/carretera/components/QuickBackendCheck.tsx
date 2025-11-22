import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Car } from '@/types/Car';
import { Diagnosis } from '@/types/Diagnosis';

export function QuickBackendCheck() {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
    const [details, setDetails] = useState<string>('');

    // Use the correct APIs for diagnosis (not damage-assessment)
    const { execute: getOrCreateVehicle } = useApi<Car>('get', '/cars/vin-or-plate');
    const { execute: createVehicle } = useApi<Car>('post', '/cars');
    const { execute: createDiagnosis } = useApi<Diagnosis>('post', '/cars/:carId/questions');

    useEffect(() => {
        checkBackend();
    }, []);

    const checkBackend = async () => {
        setStatus('checking');

        // Check 1: Auth Token
        const token = localStorage.getItem('token');
        if (!token) {
            setStatus('error');
            setDetails('No auth token - Please login');
            return;
        }

        // Check 2: Test API Call - Using the correct diagnosis API
        try {
            console.log('🔍 Testing backend with diagnosis API...');

            // Try a simpler test first - just check if we can reach any endpoint
            // The /cars/vin-or-plate endpoint might not exist yet
            try {
                // First, try to get/create a test vehicle
                const testPlate = `TEST-${Date.now().toString().slice(-6)}`;
                const vehicleResponse = await getOrCreateVehicle(undefined, {
                    plate: testPlate
                });

                if (vehicleResponse?.data?._id) {
                    console.log('✅ Backend test successful - Vehicle API works');
                    setStatus('online');
                    setDetails(`Backend OK - APIs working`);

                    // Optional: Test diagnosis creation too
                    try {
                        const diagnosisResponse = await createDiagnosis(
                            { fault: 'Backend test', notes: 'Automated test' },
                            undefined,
                            { carId: vehicleResponse.data._id }
                        );
                        if (diagnosisResponse?.data?._id) {
                            setDetails(`Backend OK - Full flow working`);
                        }
                    } catch (diagError) {
                        // Diagnosis creation might fail but vehicle API works
                        console.log('Diagnosis test failed but vehicle API works');
                    }
                } else {
                    throw new Error('No vehicle ID returned');
                }
            } catch (vehicleError: any) {
                // The /cars/vin-or-plate endpoint might not exist (404)
                // Try creating a vehicle directly as fallback
                if (vehicleError.response?.status === 404) {
                    console.log('⚠️ Get-or-create endpoint not found, trying direct creation');

                    try {
                        // Create a test vehicle directly
                        const testPlate = `TEST-${Date.now().toString().slice(-6)}`;
                        const vehicleResponse = await createVehicle({
                            plate: testPlate,
                            brand: 'Test',
                            model: 'Backend Check',
                            year: new Date().getFullYear().toString(),
                        });

                        if (vehicleResponse?.data?._id) {
                            console.log('✅ Backend test successful - Vehicle creation works');
                            setStatus('online');
                            setDetails(`Backend OK - Vehicle API working`);

                            // Try to create a diagnosis
                            try {
                                const diagnosisResponse = await createDiagnosis(
                                    { fault: 'Backend test', notes: 'Automated test' },
                                    undefined,
                                    { carId: vehicleResponse.data._id }
                                );
                                if (diagnosisResponse?.data?._id) {
                                    setDetails(`Backend OK - Full flow working`);
                                }
                            } catch (diagError) {
                                console.log('Diagnosis creation failed but vehicle API works');
                            }
                        }
                    } catch (createError: any) {
                        console.error('Direct vehicle creation also failed:', createError);
                        setStatus('offline');
                        setDetails('Backend APIs not available');
                    }
                } else {
                    throw vehicleError;
                }
            }
        } catch (error: any) {
            console.error('❌ Backend test failed:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });

            // Detailed error handling
            if (error.response) {
                // The request was made and the server responded with a status code
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    setStatus('error');
                    setDetails('Token expired - Please login again');
                } else if (status === 404) {
                    setStatus('offline');
                    setDetails('API endpoint not found (404)');
                } else if (status === 400) {
                    // Bad request - might need specific data format
                    console.log('🔄 Got 400, possible data format issue');
                    setStatus('offline');
                    setDetails(`API error: ${data?.message || data?.error || 'Bad Request'}`);
                } else if (status === 500) {
                    setStatus('offline');
                    setDetails('Server error (500)');
                } else {
                    setStatus('offline');
                    setDetails(`HTTP ${status}: ${data?.message || error.response.statusText || 'Unknown error'}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                setStatus('offline');
                setDetails('No response - Check if backend is running');
            } else {
                // Something happened in setting up the request
                console.error('Request setup error:', error.message);
                setStatus('error');
                setDetails(`Setup error: ${error.message}`);
            }
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'checking':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case 'online':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'offline':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getBgColor = () => {
        switch (status) {
            case 'checking':
                return 'bg-blue-50 border-blue-200';
            case 'online':
                return 'bg-green-50 border-green-200';
            case 'offline':
                return 'bg-red-50 border-red-200';
            case 'error':
                return 'bg-yellow-50 border-yellow-200';
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg border ${getBgColor()} shadow-sm flex items-center gap-2 text-sm`}>
            {getIcon()}
            <span className="font-medium">
                Backend: {status === 'checking' ? 'Checking...' : status.toUpperCase()}
            </span>
            {details && (
                <span className="text-xs text-gray-600">({details})</span>
            )}
            {status !== 'checking' && (
                <button
                    onClick={checkBackend}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                >
                    Retry
                </button>
            )}
        </div>
    );
}