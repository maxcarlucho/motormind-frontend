import { useState } from 'react';
import { Wifi, Loader2 } from 'lucide-react';
import { testBackendConnection, testAPIFormats } from '../debug/testBackendConnection';

export function BackendTestButton() {
    const [isTesting, setIsTesting] = useState(false);

    const handleTest = async () => {
        setIsTesting(true);
        // Open console to see results
        console.clear();
        console.log('%c🚀 BACKEND TEST STARTED', 'color: #4CAF50; font-size: 20px; font-weight: bold;');

        // Run backend test
        const success = await testBackendConnection();

        if (!success) {
            console.log('\n🔄 Trying different API formats...');
            const workingFormat = await testAPIFormats();
            if (workingFormat) {
                console.log('\n✅ Found working format:', workingFormat);
            } else {
                console.log('\n❌ No format worked. Backend might be down or API changed.');
            }
        }

        // Reset button after 1 second
        setTimeout(() => {
            setIsTesting(false);
            console.log('%c📊 Check console output above for detailed results', 'color: #2196F3; font-size: 16px;');
        }, 1000);
    };

    return (
        <button
            onClick={handleTest}
            disabled={isTesting}
            className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            title="Test Backend Connection"
        >
            {isTesting ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Testing...</span>
                </>
            ) : (
                <>
                    <Wifi className="h-5 w-5" />
                    <span>Test Backend</span>
                </>
            )}
        </button>
    );
}