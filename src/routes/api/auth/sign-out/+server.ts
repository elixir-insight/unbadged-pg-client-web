import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import { clearAuthCookies } from '$lib/server/domains/auth/session';

export const POST: RequestHandler = async ({ cookies, fetch, locals }) => {
	const log = locals.logger;
	const accessToken = cookies.get('accessToken');
	const gatewayToken = cookies.get('gatewayToken');
	const refreshToken = cookies.get('refreshToken');

	clearAuthCookies(cookies);
	log.info('sign-out — cookies cleared');

	if (accessToken && gatewayToken && refreshToken) {
		const result = await authClient.signOut(fetch, log, accessToken, gatewayToken, refreshToken);
		if (!result.ok) {
			log.warn({ error: result.error }, 'sign-out API call failed (cookies cleared regardless)');
		}
	} else {
		log.debug('sign-out called with no active session cookies');
	}

	return json({ message: 'Signed out' });
};
