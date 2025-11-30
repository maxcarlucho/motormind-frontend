/**
 * Access Token Utilities for Carretera Module
 *
 * Generates and validates scoped access tokens for client and workshop links.
 * These tokens are LIMITED in scope - they only grant access to a specific case.
 *
 * Use case:
 * - Workshop receives a link like /carretera/t/:caseId?token=XXX
 * - Multiple people at the workshop can use the same link (shareable)
 * - Works in incognito mode (no Motormind login required)
 * - Token ONLY grants access to that specific case, nothing else
 * - They can view info, submit OBD codes, and get AI diagnosis
 *
 * Security features:
 * - Tokens are scoped to a single caseId
 * - Tokens have an expiration time (TTL)
 * - Tokens are signed with HMAC-SHA256
 * - Tokens cannot be used for other cases or elevated permissions
 * - Tokens are reusable (not single-use) for team collaboration
 */

// Token configuration
const TOKEN_VERSION = '1';
const DEFAULT_CLIENT_TTL_HOURS = 24;     // 1 day for client tokens
const DEFAULT_WORKSHOP_TTL_HOURS = 168;  // 7 days for workshop tokens (need more time)

/**
 * Token types with their specific scopes
 */
export type AccessTokenType = 'client' | 'workshop';

export interface AccessTokenPayload {
    v: string;           // Version
    t: AccessTokenType;  // Token type
    c: string;           // Case ID
    car?: string;        // Car ID (optional, for client tokens)
    d?: string;          // Diagnosis ID (optional)
    exp: number;         // Expiration timestamp (Unix ms)
    iat: number;         // Issued at timestamp (Unix ms)
}

export interface DecodedAccessToken extends AccessTokenPayload {
    isValid: boolean;
    isExpired: boolean;
    error?: string;
}

/**
 * Simple HMAC-like signature using Web Crypto API
 * In production, this should use a server-side secret
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Get the secret key for token signing
 * In production, this should come from environment variables
 * and be different for each environment
 */
function getTokenSecret(): string {
    // Use a combination of factors to create a secret
    // In production, this should be a proper environment variable
    const baseSecret = 'carretera-access-token-v1';
    const envSuffix = import.meta.env.VITE_API_URL || 'local';
    return `${baseSecret}-${envSuffix}`;
}

/**
 * Generate a scoped access token for client or workshop
 *
 * @param type - Token type ('client' or 'workshop')
 * @param caseId - The case ID this token grants access to
 * @param options - Additional options (carId, diagnosisId, ttlHours)
 * @returns Base64URL encoded token string
 */
export async function generateAccessToken(
    type: AccessTokenType,
    caseId: string,
    options: {
        carId?: string;
        diagnosisId?: string;
        ttlHours?: number;
    } = {}
): Promise<string> {
    const now = Date.now();
    const defaultTtl = type === 'workshop' ? DEFAULT_WORKSHOP_TTL_HOURS : DEFAULT_CLIENT_TTL_HOURS;
    const ttlMs = (options.ttlHours || defaultTtl) * 60 * 60 * 1000;

    const payload: AccessTokenPayload = {
        v: TOKEN_VERSION,
        t: type,
        c: caseId,
        exp: now + ttlMs,
        iat: now,
    };

    // Add optional fields only if provided
    if (options.carId) payload.car = options.carId;
    if (options.diagnosisId) payload.d = options.diagnosisId;

    // Encode payload
    const payloadStr = JSON.stringify(payload);
    const payloadB64 = btoa(payloadStr)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    // Generate signature
    const signature = await generateSignature(payloadStr, getTokenSecret());

    // Return token as payload.signature
    return `${payloadB64}.${signature}`;
}

/**
 * Decode and validate an access token
 *
 * @param token - The token string to validate
 * @param expectedType - The expected token type (optional, for extra validation)
 * @param expectedCaseId - The expected case ID (optional, for extra validation)
 * @returns Decoded token with validation status
 */
export async function decodeAccessToken(
    token: string,
    expectedType?: AccessTokenType,
    expectedCaseId?: string
): Promise<DecodedAccessToken> {
    try {
        // Split token into payload and signature
        const parts = token.split('.');
        if (parts.length !== 2) {
            return createInvalidToken('Invalid token format');
        }

        const [payloadB64, providedSignature] = parts;

        // Decode payload
        const payloadStr = atob(
            payloadB64.replace(/-/g, '+').replace(/_/g, '/')
        );
        const payload: AccessTokenPayload = JSON.parse(payloadStr);

        // Verify signature
        const expectedSignature = await generateSignature(payloadStr, getTokenSecret());
        if (providedSignature !== expectedSignature) {
            return createInvalidToken('Invalid signature');
        }

        // Check version
        if (payload.v !== TOKEN_VERSION) {
            return createInvalidToken('Token version mismatch');
        }

        // Check expiration
        const isExpired = Date.now() > payload.exp;
        if (isExpired) {
            return {
                ...payload,
                isValid: false,
                isExpired: true,
                error: 'Token expired',
            };
        }

        // Check expected type if provided
        if (expectedType && payload.t !== expectedType) {
            return createInvalidToken(`Invalid token type: expected ${expectedType}, got ${payload.t}`);
        }

        // Check expected case ID if provided
        if (expectedCaseId && payload.c !== expectedCaseId) {
            return createInvalidToken('Token not valid for this case');
        }

        return {
            ...payload,
            isValid: true,
            isExpired: false,
        };
    } catch (error) {
        return createInvalidToken('Failed to decode token');
    }
}

/**
 * Helper to create an invalid token response
 */
function createInvalidToken(error: string): DecodedAccessToken {
    return {
        v: '',
        t: 'client',
        c: '',
        exp: 0,
        iat: 0,
        isValid: false,
        isExpired: false,
        error,
    };
}

/**
 * Check if a token is valid for a specific case
 * Quick validation without full decode
 */
export async function isTokenValidForCase(
    token: string,
    caseId: string,
    type?: AccessTokenType
): Promise<boolean> {
    const decoded = await decodeAccessToken(token, type, caseId);
    return decoded.isValid && !decoded.isExpired;
}

/**
 * Extract case ID from token without full validation
 * Useful for quick lookups before full validation
 */
export function extractCaseIdFromToken(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return null;

        const payloadStr = atob(
            parts[0].replace(/-/g, '+').replace(/_/g, '/')
        );
        const payload = JSON.parse(payloadStr);
        return payload.c || null;
    } catch {
        return null;
    }
}
