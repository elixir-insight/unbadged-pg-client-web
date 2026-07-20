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

/** Refresh rejected — session revoked / inactive; user must sign in again. */
export class SessionInactiveError extends SessionError {
	constructor(
		message = 'Session is no longer active',
		readonly exceptionCode = 'AUTH_UNAUTHORIZED_A16'
	) {
		super(message);
		this.name = 'SessionInactiveError';
	}
}

const SESSION_INACTIVE_CODE = 'AUTH_UNAUTHORIZED_A16';

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
			if (!result.ok) {
				const isSessionInactive =
					result.error.kind === 'http' &&
					(result.error.code === SESSION_INACTIVE_CODE ||
						result.error.message === 'Session is no longer active');

				if (isSessionInactive) {
					logger.warn(
						{
							exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
							status: result.error.kind === 'http' ? result.error.status : undefined,
							message: result.error.message
						},
						'refresh rejected — session inactive, requiring re-login'
					);
					throw new SessionInactiveError(
						result.error.message || 'Session is no longer active',
						result.error.kind === 'http'
							? (result.error.code ?? SESSION_INACTIVE_CODE)
							: SESSION_INACTIVE_CODE
					);
				}
				logger.warn(
					{
						errorKind: result.error.kind,
						...(result.error.kind === 'http'
							? { status: result.error.status, code: result.error.code }
							: {})
					},
					'refresh failed'
				);
				return null;
			}
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
