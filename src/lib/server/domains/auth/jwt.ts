/**
 * Decode a JWT payload without verifying the signature.
 * Verification is the backend's job; we only read claims server-side for session maintenance.
 */
export function decodeJwt<T>(token: string): T {
	const parts = token.split('.');
	if (parts.length < 2 || !parts[1]) {
		throw new Error('Invalid JWT: missing payload segment');
	}

	const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
	const json =
		typeof Buffer !== 'undefined' ? Buffer.from(padded, 'base64').toString('utf8') : atob(padded);

	return JSON.parse(json) as T;
}
