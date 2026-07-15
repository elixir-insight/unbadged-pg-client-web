import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { authClient } from './client';
import { clearAuthCookies } from './session';

/**
 * Clears auth cookies first (so the browser session ends even if the
 * backend call fails), then best-effort notifies the API.
 */
export async function performSignOut(opts: {
	fetch: typeof fetch;
	cookies: Cookies;
	logger: Logger;
}): Promise<{ backendNotified: boolean }> {
	const { fetch: fetchFn, cookies, logger: log } = opts;

	const accessToken = cookies.get('accessToken');
	const gatewayToken = cookies.get('gatewayToken');
	const refreshToken = cookies.get('refreshToken');

	clearAuthCookies(cookies);
	log.info('sign-out — cookies cleared');

	if (!accessToken || !gatewayToken || !refreshToken) {
		log.debug('sign-out called with no active session cookies');
		return { backendNotified: false };
	}

	const result = await authClient.signOut(fetchFn, log, accessToken, gatewayToken, refreshToken);
	if (!result.ok) {
		log.warn({ error: result.error }, 'sign-out API call failed (cookies cleared regardless)');
		return { backendNotified: false };
	}

	log.info('sign-out — backend notified');
	return { backendNotified: true };
}
