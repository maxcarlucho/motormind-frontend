import { useState, useEffect, createContext, useContext } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldX, Clock, AlertTriangle } from 'lucide-react';
import {
    decodeAccessToken,
    AccessTokenType,
    DecodedAccessToken,
} from '../utils/accessToken';

/**
 * Context to share validated token data with child components
 */
interface AccessTokenContextValue {
    token: string;
    decoded: DecodedAccessToken;
    caseId: string;
    carId?: string;
    diagnosisId?: string;
}

const AccessTokenContext = createContext<AccessTokenContextValue | null>(null);

/**
 * Hook to access the validated token data from context
 * Must be used within a RequireAccessToken component
 */
export function useAccessToken(): AccessTokenContextValue {
    const context = useContext(AccessTokenContext);
    if (!context) {
        throw new Error('useAccessToken must be used within RequireAccessToken');
    }
    return context;
}

/**
 * Props for RequireAccessToken component
 */
interface RequireAccessTokenProps {
    children: React.ReactNode;
    tokenType: AccessTokenType;
    tokenParam?: string; // Query param name, defaults to 'token'
}

/**
 * RequireAccessToken - Protects routes that need a valid scoped token
 *
 * This component:
 * 1. Extracts token from URL query params
 * 2. Validates the token signature and expiration
 * 3. Verifies the token is for the correct case (from URL :id param)
 * 4. Verifies the token type matches expected (client vs workshop)
 * 5. Provides token data to children via context
 *
 * If validation fails, shows an appropriate error screen.
 * No login required - works in incognito mode.
 */
export function RequireAccessToken({
    children,
    tokenType,
    tokenParam = 'token',
}: RequireAccessTokenProps) {
    const { id: caseId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get(tokenParam);

    const [isValidating, setIsValidating] = useState(true);
    const [decoded, setDecoded] = useState<DecodedAccessToken | null>(null);
    const [error, setError] = useState<'missing' | 'invalid' | 'expired' | 'wrong-case' | null>(null);

    useEffect(() => {
        async function validateToken() {
            setIsValidating(true);
            setError(null);

            // Check if token is provided
            if (!token) {
                setError('missing');
                setIsValidating(false);
                return;
            }

            // Check if caseId is provided
            if (!caseId) {
                setError('invalid');
                setIsValidating(false);
                return;
            }

            try {
                // Decode and validate token
                const result = await decodeAccessToken(token, tokenType, caseId);

                if (!result.isValid) {
                    if (result.isExpired) {
                        setError('expired');
                    } else if (result.error?.includes('not valid for this case')) {
                        setError('wrong-case');
                    } else {
                        setError('invalid');
                    }
                    setIsValidating(false);
                    return;
                }

                // Token is valid!
                setDecoded(result);
            } catch (err) {
                console.error('Token validation error:', err);
                setError('invalid');
            } finally {
                setIsValidating(false);
            }
        }

        validateToken();
    }, [token, caseId, tokenType]);

    // Loading state
    if (isValidating) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Validando acceso...</p>
                </div>
            </div>
        );
    }

    // Error states
    if (error) {
        return <AccessDeniedScreen error={error} tokenType={tokenType} />;
    }

    // Token is valid - provide context to children
    if (decoded && token && caseId) {
        const contextValue: AccessTokenContextValue = {
            token,
            decoded,
            caseId,
            carId: decoded.car,
            diagnosisId: decoded.d,
        };

        return (
            <AccessTokenContext.Provider value={contextValue}>
                {children}
            </AccessTokenContext.Provider>
        );
    }

    // Fallback (shouldn't reach here)
    return <AccessDeniedScreen error="invalid" tokenType={tokenType} />;
}

/**
 * Access Denied Screen - Shows appropriate error message
 */
function AccessDeniedScreen({
    error,
    tokenType,
}: {
    error: 'missing' | 'invalid' | 'expired' | 'wrong-case';
    tokenType: AccessTokenType;
}) {
    const titles: Record<typeof error, string> = {
        missing: 'Enlace Incompleto',
        invalid: 'Enlace No Válido',
        expired: 'Enlace Expirado',
        'wrong-case': 'Acceso Denegado',
    };

    const messages: Record<typeof error, string> = {
        missing:
            'Este enlace no contiene la autorización necesaria. Por favor, solicita un nuevo enlace.',
        invalid:
            'El enlace de acceso no es válido. Puede haber sido modificado o es incorrecto.',
        expired:
            'Este enlace ha expirado. Por favor, solicita un nuevo enlace de acceso.',
        'wrong-case':
            'Este enlace no corresponde a este caso. Verifica que estás usando el enlace correcto.',
    };

    const icons: Record<typeof error, React.ReactNode> = {
        missing: <AlertTriangle className="h-16 w-16 text-amber-500" />,
        invalid: <ShieldX className="h-16 w-16 text-red-500" />,
        expired: <Clock className="h-16 w-16 text-orange-500" />,
        'wrong-case': <ShieldX className="h-16 w-16 text-red-500" />,
    };

    const contactLabel = tokenType === 'workshop' ? 'gruista' : 'operador';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="mb-6 flex justify-center">{icons[error]}</div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    {titles[error]}
                </h1>

                <p className="text-gray-600 mb-6">{messages[error]}</p>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                    <p>
                        Si crees que esto es un error, contacta al {contactLabel} que te
                        envió este enlace para obtener uno nuevo.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RequireAccessToken;
