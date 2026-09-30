import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Logger } from 'pino';
import * as v from 'valibot';
import {
	ConfirmSignUpRequestSchema,
	ResendSignUpConfirmationRequestSchema
} from '$lib/server/domains/auth/schema';
import {
	performConfirmSignUp,
	performResendSignUpConfirmation,
	readSignupAccount
} from '$lib/server/domains/auth/sign-up';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies } from '$lib/server/domains/auth/session';
import { decodeJwt } from '$lib/server/domains/auth/jwt';
import { collectPortalGroups, resolvePortalHome } from '$lib/stores/auth/portal';
import type { AccessTokenPayload, GatewayTokenPayload } from '$lib/stores/auth/types';

async function redirectIfAlreadySignedIn(
	cookies: Cookies,
	fetchFn: typeof fetch,
	logger: Logger
): Promise<void> {
	try {
		const tokens = await getValidSession(cookies, fetchFn, logger);
		const accessPayload = decodeJwt<AccessTokenPayload>(tokens.accessToken);
		const gatewayPayload = decodeJwt<GatewayTokenPayload>(tokens.gatewayToken);
		const groups = collectPortalGroups(accessPayload['cognito:groups'], gatewayPayload.group);
		const home = resolvePortalHome(groups);
		logger.info({ home, groups }, 'signed-in user hit confirm-email — redirecting to portal home');
		redirect(303, home);
	} catch (e) {
		if (e instanceof SessionInactiveError) {
			clearAuthCookies(cookies);
			return;
		}
		if (e instanceof SessionError) {
			if (e.message.includes('refresh')) clearAuthCookies(cookies);
			return;
		}
		throw e;
	}
}

/**
 * The email being confirmed is never accepted from the client (form field or URL) —
 * it always comes from the httpOnly signupAccount cookie set at signup/login time,
 * so it never appears in the URL, browser history, or server access logs.
 */
function requireSessionEmail(cookies: Cookies): string | null {
	const email = readSignupAccount(cookies)?.userEmail.trim().toLowerCase();
	return email ? email : null;
}

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

	const userEmail = requireSessionEmail(cookies);
	if (!userEmail) redirect(303, '/sign-up');

	return { userEmail };
};

export const actions = {
	confirm: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const userEmail = requireSessionEmail(cookies);
		if (!userEmail) redirect(303, '/sign-up');

		const formData = await request.formData();
		const confirmationCode = String(formData.get('confirmationCode') ?? '').replace(/\D/g, '');

		const parsed = v.safeParse(ConfirmSignUpRequestSchema, { userEmail, confirmationCode });
		if (!parsed.success) {
			const message = parsed.issues[0]?.message ?? 'Enter the 6-digit code.';
			return fail(400, { confirmationCode, codeError: message });
		}

		const result = await performConfirmSignUp({
			fetch,
			logger: log,
			ip,
			userEmail: parsed.output.userEmail,
			confirmationCode: parsed.output.confirmationCode
		});

		if (!result.ok) {
			return fail(result.status, {
				confirmationCode: parsed.output.confirmationCode,
				codeError: result.message
			});
		}

		// No redirect here — the client shows a brief "Email verified" success
		// state before navigating to /login itself.
		return { verified: true as const };
	},

	resend: async ({ cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const userEmail = requireSessionEmail(cookies);
		if (!userEmail) redirect(303, '/sign-up');

		const parsed = v.safeParse(ResendSignUpConfirmationRequestSchema, { userEmail });
		if (!parsed.success) {
			return fail(400, {
				resendError: parsed.issues[0]?.message ?? 'Enter a valid email.',
				resendFailed: true as const
			});
		}

		const result = await performResendSignUpConfirmation({
			fetch,
			logger: log,
			ip,
			userEmail: parsed.output.userEmail
		});

		if (!result.ok) {
			return fail(result.status, {
				resendError: result.message,
				resendFailed: true as const
			});
		}

		return { resendSuccess: true as const, message: result.message };
	}
} satisfies Actions;
