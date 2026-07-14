import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_OPTS = {
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'strict' as const
};

export function storeSession(
	cookies: Cookies,
	tokens: { accessToken: string; gatewayToken: string; idToken: string; refreshToken: string }
) {
	cookies.set('accessToken', tokens.accessToken, COOKIE_OPTS);
	cookies.set('gatewayToken', tokens.gatewayToken, COOKIE_OPTS);
	cookies.set('idToken', tokens.idToken, COOKIE_OPTS);
	// Placeholder maxAge — confirm against the live refresh token `exp` later.
	cookies.set('refreshToken', tokens.refreshToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7 });
}

export function clearAuthCookies(cookies: Cookies) {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('gatewayToken', { path: '/' });
	cookies.delete('idToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
}
