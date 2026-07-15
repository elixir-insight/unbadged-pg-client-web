import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { authClient } from './client';
import { decodeJwt } from './jwt';
import { storeSession } from './session';
import { resolvePortalHome } from '$lib/stores/auth/portal';
import type { PortalHomePath, AccessTokenPayload } from '$lib/stores/auth/types';
export type SignInSuccess = {
	ok: true;
	redirectTo: PortalHomePath;
};
export type SignInFailure = {
	ok: false;
	status: number;
	message: string;
	exceptionCode?: string;
	requiresForce?: boolean;
};
export type SignInResult = SignInSuccess | SignInFailure;
function isSessionAlreadyExists(
	item: { sessionAlreadyExists: true } | { accessToken: string }
): item is { sessionAlreadyExists: true } {
	return 'sessionAlreadyExists' in item && item.sessionAlreadyExists === true;
}
export async function performSignIn(opts: {
	fetch: typeof fetch;
	cookies: Cookies;
	logger: Logger;
	ip: string;
	userEmail: string;
	password: string;
	force?: boolean;
}): Promise<SignInResult> {
	const { fetch: fetchFn, cookies, logger: log, ip, userEmail, password, force = false } = opts;
	log.info({ ip, userEmail }, 'sign-in attempt');
	const result = await authClient.signIn(fetchFn, log, userEmail, password, force);
	if (!result.ok) {
		const exceptionCode = result.error.kind === 'http' ? result.error.code : undefined;
		const upstreamStatus = result.error.kind === 'http' ? result.error.status : undefined;
		const message =
			result.error.kind === 'http' ? result.error.message : 'Invalid email or password.';
		// Legacy shape with exceptionCode (if upstream ever sends it).
		const requiresForce =
			exceptionCode === 'FAILED_TO_SIGN_IN' &&
			message === 'User Session Already Exists' &&
			upstreamStatus === 202;
		if (requiresForce) {
			log.warn(
				{ ip, userEmail, exceptionCode, errorKind: result.error.kind, upstreamStatus },
				'sign-in requires force — session already exists'
			);
			return {
				ok: false,
				status: 409,
				message,
				exceptionCode,
				requiresForce: true
			};
		}
		if (result.error.kind === 'http' && upstreamStatus === 404) {
			log.warn(
				{ ip, userEmail, exceptionCode, errorKind: result.error.kind, upstreamStatus },
				'sign-in failed — upstream 404'
			);
			return {
				ok: false,
				status: 404,
				exceptionCode,
				message:
					message && message !== 'Request failed (404)' ? message : 'Sign-in endpoint not found.'
			};
		}
		const status =
			result.error.kind === 'http' && result.error.status >= 400 && result.error.status < 500
				? result.error.status
				: 401;
		log.warn(
			{ ip, userEmail, exceptionCode, errorKind: result.error.kind, status },
			'sign-in failed'
		);
		return { ok: false, status, message, exceptionCode };
	}
	const item = result.data.data[0];
	if (!item) {
		log.error({ ip, userEmail }, 'sign-in succeeded but no tokens returned');
		return {
			ok: false,
			status: 502,
			message: 'Sign-in succeeded but no tokens were returned.'
		};
	}
	// { data: [{ sessionAlreadyExists: true }], message: "...", statusCode: 202 }
	if (isSessionAlreadyExists(item)) {
		log.warn({ ip, userEmail }, 'sign-in requires force — session already exists');
		return {
			ok: false,
			status: 409,
			message: result.data.message,
			requiresForce: true
		};
	}
	const accessPayload = decodeJwt<AccessTokenPayload>(item.accessToken);
	const groups = accessPayload['cognito:groups'] ?? [];
	const redirectTo = resolvePortalHome(groups);
	log.info({ ip, userEmail, redirectTo, groups }, 'sign-in succeeded');
	storeSession(cookies, item);
	return { ok: true, redirectTo };
}
