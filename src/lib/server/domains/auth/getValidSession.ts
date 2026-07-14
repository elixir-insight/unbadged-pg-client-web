import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { authClient } from './client';
import { decodeJwt } from './jwt';
import { storeSession } from './session';

type SessionTokens = {
	accessToken: string;
	gatewayToken: string;
	idToken: string;
	refreshToken: string;
};

export class SessionError extends Error {}

const inFlightRefreshes = new Map<string, Promise<SessionTokens | null>>();

export async function getValidSession(
	cookies: Cookies,
	fetchFn: typeof fetch,
	logger: Logger
): Promise<SessionTokens> {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = cookies.get('gatewayToken');
	const idToken = cookies.get('idToken');
	const refreshToken = cookies.get('refreshToken');

	if (!accessToken || !gatewayToken || !idToken || !refreshToken) {
		throw new SessionError('No session found');
	}

	const decoded = decodeJwt<{ exp: number }>(accessToken);
	const isExpired = decoded.exp * 1000 < Date.now();
	if (!isExpired) {
		return { accessToken, gatewayToken, idToken, refreshToken };
	}

	logger.info('access token expired — attempting refresh');

	// Single-flight: concurrent requests hitting expiry at the same moment
	// share ONE refresh call instead of racing separate ones.
	let refreshPromise = inFlightRefreshes.get(refreshToken);
	if (!refreshPromise) {
		refreshPromise = (async () => {
			const result = await authClient.refresh(
				fetchFn,
				logger,
				accessToken,
				gatewayToken,
				refreshToken
			);
			if (!result.ok) return null;
			return result.data.data[0] ?? null;
		})().finally(() => inFlightRefreshes.delete(refreshToken));
		inFlightRefreshes.set(refreshToken, refreshPromise);
	}

	const newTokens = await refreshPromise;
	if (!newTokens) {
		throw new SessionError('Failed to refresh session — please log in again');
	}

	storeSession(cookies, newTokens);
	logger.info('session refreshed successfully');
	return newTokens;
}
