import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { SignInBodySchema } from '$lib/server/domains/auth/schema';
import { performSignIn } from '$lib/server/domains/auth/sign-in';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies, storePasswordChallenge } from '$lib/server/domains/auth/session';
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

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);
};

export const actions = {
	default: async ({ request, cookies, fetch, locals, getClientAddress }) => {
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
				userEmail: raw.userEmail.trim(),
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
				storePasswordChallenge(cookies, {
					userEmail: result.userEmail,
					challengeSession: result.challengeSession
				});
				redirect(303, '/reset-temporary-password');
			}
			return fail(result.status, {
				message: result.message,
				userEmail: parsed.output.userEmail,
				requiresForce: result.requiresForce === true,
				exceptionCode: result.exceptionCode
			});
		}

		redirect(303, result.redirectTo);
	}
} satisfies Actions;
