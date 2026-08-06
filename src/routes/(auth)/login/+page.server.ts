import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { SignInBodySchema, VerifyMfaRequestSchema } from '$lib/server/domains/auth/schema';
import { performSignIn, startAuthenticatedSession } from '$lib/server/domains/auth/sign-in';
import { authClient } from '$lib/server/domains/auth/client';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import {
	clearAuthCookies,
	clearMfaChallenge,
	readMfaChallenge,
	storeMfaChallenge,
	storePasswordChallenge
} from '$lib/server/domains/auth/session';
import { decodeJwt } from '$lib/server/domains/auth/jwt';
import { resolvePortalHome } from '$lib/stores/auth/portal';
import type { AccessTokenPayload } from '$lib/stores/auth/types';

/**
 * If the user still has a valid session (cookies not cleared / not logged out),
 * bounce them away from /login to their portal home.
 */
async function redirectIfAlreadySignedIn(
	cookies: Cookies,
	fetchFn: typeof fetch,
	logger: Logger
): Promise<void> {
	try {
		const tokens = await getValidSession(cookies, fetchFn, logger);
		const accessPayload = decodeJwt<AccessTokenPayload>(tokens.accessToken);
		const groups = accessPayload['cognito:groups'] ?? [];
		const home = resolvePortalHome(groups);
		logger.info({ home, groups }, 'signed-in user hit login — redirecting to portal home');
		redirect(303, home);
	} catch (e) {
		if (e instanceof SessionInactiveError) {
			clearAuthCookies(cookies);
			return;
		}
		if (e instanceof SessionError) {
			// Stale cookies after a failed refresh — clear so login can proceed cleanly.
			if (e.message.includes('refresh')) clearAuthCookies(cookies);
			return;
		}
		throw e;
	}
}

function mfaChallengeView(challenge: NonNullable<ReturnType<typeof readMfaChallenge>>) {
	return {
		userEmail: challenge.userEmail,
		challengeName: challenge.challengeName,
		challengeDestination: challenge.challengeDestination,
		challengeExpiresIn: challenge.challengeExpiresIn
	};
}

/** Messages that mean the MFA challenge is no longer usable — user must sign in again. */
function isMfaChallengeTerminal(message: string): boolean {
	const normalized = message.toLowerCase();
	return (
		normalized.includes('expired') ||
		normalized.includes('sign in again') ||
		normalized.includes('too many')
	);
}

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);
	const challenge = readMfaChallenge(cookies);
	return {
		mfaChallenge: challenge ? mfaChallengeView(challenge) : null
	};
};

export const actions = {
	login: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const formData = await request.formData();
		const raw = {
			userEmail: String(formData.get('userEmail') ?? ''),
			password: String(formData.get('password') ?? ''),
			force: formData.get('force') === 'true'
		};

		const parsed = v.safeParse(SignInBodySchema, raw);
		if (!parsed.success) {
			log.warn({ ip, issues: parsed.issues }, 'sign-in rejected — invalid request body');
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Invalid email or password format',
				userEmail: raw.userEmail.trim().toLowerCase(),
				requiresForce: false
			});
		}

		const result = await performSignIn({
			fetch,
			cookies,
			logger: log,
			ip,
			userEmail: parsed.output.userEmail,
			password: parsed.output.password,
			force: parsed.output.force
		});

		if (!result.ok) {
			// Temporary password — stash the challenge in an httpOnly cookie and
			// send the user to set a new password.
			if ('requiresPasswordChange' in result) {
				clearMfaChallenge(cookies);
				storePasswordChallenge(cookies, {
					userEmail: result.userEmail,
					challengeSession: result.challengeSession
				});
				redirect(303, '/reset-temporary-password');
			}

			if ('requiresMfa' in result) {
				storeMfaChallenge(cookies, {
					userEmail: result.userEmail,
					challengeName: result.challengeName,
					challengeSession: result.challengeSession,
					challengeDestination: result.challengeDestination,
					challengeExpiresIn: result.challengeExpiresIn
				});
				log.info(
					{ ip, userEmail: result.userEmail, challengeName: result.challengeName },
					'sign-in MFA challenge stored — awaiting OTP'
				);
				return {
					mfaRequired: true as const,
					message: result.message,
					mfaChallenge: {
						userEmail: result.userEmail,
						challengeName: result.challengeName,
						challengeDestination: result.challengeDestination,
						challengeExpiresIn: result.challengeExpiresIn
					}
				};
			}

			return fail(result.status, {
				message: result.message,
				userEmail: parsed.output.userEmail,
				requiresForce: result.requiresForce === true,
				exceptionCode: result.exceptionCode
			});
		}

		clearMfaChallenge(cookies);
		redirect(303, result.redirectTo);
	},

	verifyMfa: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const challenge = readMfaChallenge(cookies);
		if (!challenge) {
			log.warn({ ip }, 'MFA verify rejected — no challenge cookie');
			return fail(400, {
				message: 'MFA Challenge Expired or Invalid, Sign In Again',
				mfaRestart: true
			});
		}

		const formData = await request.formData();
		const code = String(formData.get('code') ?? '').replace(/\D/g, '');
		const parsed = v.safeParse(VerifyMfaRequestSchema, {
			userEmail: challenge.userEmail,
			challengeName: challenge.challengeName,
			challengeSession: challenge.challengeSession,
			code
		});

		if (!parsed.success) {
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Enter the 6-digit verification code',
				mfaChallenge: mfaChallengeView(challenge),
				mfaInvalidCode: true
			});
		}

		const result = await authClient.verifyMfa(fetch, log, parsed.output);
		if (!result.ok) {
			const message =
				result.error.kind === 'http' ? result.error.message : 'Unable to verify MFA code.';
			const status =
				result.error.kind === 'http' && result.error.status >= 400 && result.error.status < 500
					? result.error.status
					: 400;

			log.warn(
				{
					ip,
					userEmail: challenge.userEmail,
					challengeName: challenge.challengeName,
					errorKind: result.error.kind,
					status
				},
				'MFA verify failed'
			);

			if (isMfaChallengeTerminal(message)) {
				clearMfaChallenge(cookies);
				return fail(status, {
					message,
					mfaRestart: true,
					userEmail: challenge.userEmail
				});
			}

			return fail(status, {
				message,
				mfaChallenge: mfaChallengeView(challenge),
				mfaInvalidCode: true
			});
		}

		const tokens = result.data.data[0];
		if (!tokens) {
			log.error({ ip, userEmail: challenge.userEmail }, 'MFA verify succeeded but no tokens');
			return fail(502, {
				message: 'Verification succeeded but no tokens were returned.',
				mfaChallenge: mfaChallengeView(challenge)
			});
		}

		clearMfaChallenge(cookies);
		const redirectTo = startAuthenticatedSession(cookies, tokens);
		log.info({ ip, userEmail: challenge.userEmail, redirectTo }, 'MFA verified — signed in');
		redirect(303, redirectTo);
	},

	cancelMfa: async ({ cookies, locals, getClientAddress }) => {
		const log = locals.logger;
		const ip = getClientAddress();
		const challenge = readMfaChallenge(cookies);
		clearMfaChallenge(cookies);
		log.info({ ip, userEmail: challenge?.userEmail }, 'MFA challenge cancelled — back to sign-in');
		return {
			mfaCancelled: true as const,
			userEmail: challenge?.userEmail ?? ''
		};
	}
} satisfies Actions;
