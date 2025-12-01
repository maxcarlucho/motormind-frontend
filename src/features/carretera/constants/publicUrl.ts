/**
 * Public URL for Carretera client links
 *
 * This URL is used when generating links to send to clients (via WhatsApp, etc.)
 * It ensures that even when working from development, the links point to the
 * production Carretera app.
 *
 * Set VITE_CARRETERA_PUBLIC_URL in .env and Railway environment variables.
 */

const defaultUrl = typeof window !== 'undefined' ? window.location.origin : '';

export const CARRETERA_PUBLIC_URL = import.meta.env.VITE_CARRETERA_PUBLIC_URL || defaultUrl;

/**
 * Get the full public URL for a client link path
 * @param path - The path (e.g., "/carretera/c/abc123?token=xyz")
 * @returns Full URL with the public domain
 */
export function getPublicClientUrl(path: string): string {
    // If path is already a full URL, check if we need to replace the origin
    if (path.startsWith('http')) {
        // If CARRETERA_PUBLIC_URL is set, replace the origin
        if (import.meta.env.VITE_CARRETERA_PUBLIC_URL) {
            try {
                const url = new URL(path);
                return `${CARRETERA_PUBLIC_URL}${url.pathname}${url.search}`;
            } catch {
                return path;
            }
        }
        return path;
    }

    // Path is relative, prepend the public URL
    return `${CARRETERA_PUBLIC_URL}${path}`;
}
