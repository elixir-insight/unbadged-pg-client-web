import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import { clearAuthCookies } from '$lib/server/domains/auth/session';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = cookies.get('gatewayToken');
	const refreshToken = cookies.get('refreshToken');

	clearAuthCookies(cookies);

	if (accessToken && gatewayToken && refreshToken) {
		await authClient.signOut(fetch, accessToken, gatewayToken, refreshToken).catch(() => null);
	}

	return json({ message: 'Signed out' });
};
