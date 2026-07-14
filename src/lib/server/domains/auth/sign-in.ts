import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { authClient } from './client';
import { decodeJwt } from './jwt';
import { storeSession } from './session';
import { resolvePortalHome } from '$lib/stores/auth/portal';
import type { PortalHomePath, GatewayTokenPayload } from '$lib/stores/auth/types';

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

		// Force-login modal only for this exact upstream payload:
		// { exceptionCode: "FAILED_TO_SIGN_IN", message: "User Session Already Exists", statusCode: 202 }
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

	const tokens = result.data.data[0];
	if (!tokens) {
		log.error({ ip, userEmail }, 'sign-in succeeded but no tokens returned');
		return {
			ok: false,
			status: 502,
			message: 'Sign-in succeeded but no tokens were returned.'
		};
	}

	const gatewayPayload = decodeJwt<GatewayTokenPayload>(tokens.gatewayToken);
	const redirectTo = resolvePortalHome(gatewayPayload['cognito:groups'] ?? []);

	log.info(
		{ ip, userEmail, redirectTo, groups: gatewayPayload['cognito:groups'] },
		'sign-in succeeded'
	);
	storeSession(cookies, tokens);
	return { ok: true, redirectTo };
}
