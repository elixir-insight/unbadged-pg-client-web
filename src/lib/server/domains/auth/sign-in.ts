import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { authClient } from './client';
import { decodeJwt } from './jwt';
import {
	AuthTokensSchema,
	SignInMfaChallengeResponseSchema,
	SignInPasswordChangeResponseSchema,
	type MfaChallengeName
} from './schema';
import { storeSession } from './session';
import { collectPortalGroups, resolvePortalHome } from '$lib/stores/auth/portal';
import type {
	PortalHomePath,
	AccessTokenPayload,
	GatewayTokenPayload
} from '$lib/stores/auth/types';

export type AuthTokenBundle = v.InferOutput<typeof AuthTokensSchema>;

export function extractAuthTokens(data: unknown): AuthTokenBundle | null {
	const parsed = v.safeParse(AuthTokensSchema, data);
	return parsed.success ? parsed.output : null;
}

/** Persist auth cookies and resolve the portal home for the signed-in user. */
export function startAuthenticatedSession(
	cookies: Cookies,
	tokens: AuthTokenBundle
): PortalHomePath {
	storeSession(cookies, tokens);
	const accessPayload = decodeJwt<AccessTokenPayload>(tokens.accessToken);
	const gatewayPayload = decodeJwt<GatewayTokenPayload>(tokens.gatewayToken);
	return resolvePortalHome(
		collectPortalGroups(accessPayload['cognito:groups'], gatewayPayload.group)
	);
}
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
export type SignInPasswordChangeRequired = {
	ok: false;
	status: 202;
	message: string;
	requiresPasswordChange: true;
	challengeSession: string;
	userEmail: string;
};
export type SignInMfaRequired = {
	ok: false;
	status: 202;
	message: string;
	requiresMfa: true;
	userEmail: string;
	challengeName: MfaChallengeName;
	challengeSession: string;
	challengeDestination: string;
	challengeExpiresIn: number;
};
export type SignInEmailConfirmationRequired = {
	ok: false;
	status: 403;
	message: string;
	requiresEmailConfirmation: true;
	userEmail: string;
};
export type SignInResult =
	| SignInSuccess
	| SignInFailure
	| SignInPasswordChangeRequired
	| SignInMfaRequired
	| SignInEmailConfirmationRequired;

type SignInMfaChallengeItem = {
	challengeName: MfaChallengeName;
	challengeSession: string;
	challengeDestination: string;
	challengeExpiresIn: number;
};

type SignInDataItem =
	| { sessionAlreadyExists: true }
	| { challengeSession: string; requiresPasswordChange: true }
	| SignInMfaChallengeItem
	| { accessToken: string; gatewayToken: string; idToken: string; refreshToken: string };

function isSessionAlreadyExists(item: SignInDataItem): item is { sessionAlreadyExists: true } {
	return 'sessionAlreadyExists' in item && item.sessionAlreadyExists === true;
}

function isPasswordChangeRequired(
	item: SignInDataItem
): item is { challengeSession: string; requiresPasswordChange: true } {
	return 'requiresPasswordChange' in item && item.requiresPasswordChange === true;
}

function isMfaChallenge(item: SignInDataItem): item is SignInMfaChallengeItem {
	return (
		'challengeName' in item &&
		(item.challengeName === 'EMAIL_OTP' || item.challengeName === 'SMS_MFA')
	);
}

function isUserNotConfirmed(message: string, exceptionCode?: string): boolean {
	const haystack = `${exceptionCode ?? ''} ${message}`.toLowerCase();
	return (
		haystack.includes('not confirmed') ||
		haystack.includes('userunconfirmed') ||
		haystack.includes('user_not_confirmed')
	);
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
		// 202 challenges can arrive through the error path when the body carries
		// an exceptionCode — recover password-change or MFA challenge from the raw body.
		if (result.error.kind === 'http') {
			const pwParse = v.safeParse(SignInPasswordChangeResponseSchema, result.error.body);
			const pwItem = pwParse.success ? pwParse.output.data[0] : undefined;
			if (pwItem) {
				log.info({ ip, userEmail }, 'sign-in requires password change — temporary password');
				return {
					ok: false,
					status: 202,
					message: pwParse.success ? pwParse.output.message : '',
					requiresPasswordChange: true,
					challengeSession: pwItem.challengeSession,
					userEmail
				};
			}
			const mfaParse = v.safeParse(SignInMfaChallengeResponseSchema, result.error.body);
			const mfaItem = mfaParse.success ? mfaParse.output.data[0] : undefined;
			if (mfaItem) {
				log.info(
					{ ip, userEmail, challengeName: mfaItem.challengeName },
					'sign-in requires MFA verification'
				);
				return {
					ok: false,
					status: 202,
					message: mfaParse.success ? mfaParse.output.message : '',
					requiresMfa: true,
					userEmail,
					challengeName: mfaItem.challengeName,
					challengeSession: mfaItem.challengeSession,
					challengeDestination: mfaItem.challengeDestination,
					challengeExpiresIn: mfaItem.challengeExpiresIn
				};
			}
		}
		const exceptionCode = result.error.kind === 'http' ? result.error.code : undefined;
		const upstreamStatus = result.error.kind === 'http' ? result.error.status : undefined;
		const message =
			result.error.kind === 'http' ? result.error.message : 'Invalid email or password.';
		if (isUserNotConfirmed(message, exceptionCode)) {
			log.info({ ip, userEmail, exceptionCode }, 'sign-in requires email confirmation');
			return {
				ok: false,
				status: 403,
				message,
				requiresEmailConfirmation: true,
				userEmail
			};
		}
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
	// { data: [{ challengeSession, requiresPasswordChange: true }], message: "Password change required", statusCode: 202 }
	if (isPasswordChangeRequired(item)) {
		log.info({ ip, userEmail }, 'sign-in requires password change — temporary password');
		return {
			ok: false,
			status: 202,
			message: result.data.message,
			requiresPasswordChange: true,
			challengeSession: item.challengeSession,
			userEmail
		};
	}
	// { data: [{ challengeName, challengeSession, ... }], message: "OTP verification required", statusCode: 202 }
	if (isMfaChallenge(item)) {
		log.info(
			{ ip, userEmail, challengeName: item.challengeName },
			'sign-in requires MFA verification'
		);
		return {
			ok: false,
			status: 202,
			message: result.data.message,
			requiresMfa: true,
			userEmail,
			challengeName: item.challengeName,
			challengeSession: item.challengeSession,
			challengeDestination: item.challengeDestination,
			challengeExpiresIn: item.challengeExpiresIn
		};
	}
	const tokens = extractAuthTokens(item);
	if (!tokens) {
		log.error({ ip, userEmail }, 'sign-in succeeded but no tokens returned');
		return {
			ok: false,
			status: 502,
			message: 'Sign-in succeeded but no tokens were returned.'
		};
	}
	const redirectTo = startAuthenticatedSession(cookies, tokens);
	log.info({ ip, userEmail, redirectTo }, 'sign-in succeeded');
	return { ok: true, redirectTo };
}
