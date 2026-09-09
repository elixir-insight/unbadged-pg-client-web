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
		logger.info({ home, groups }, 'signed-in user hit confirm-signup — redirecting to portal home');
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

function readEmail(formData: FormData): string {
	return String(formData.get('userEmail') ?? '')
		.trim()
		.toLowerCase();
}

export const load: PageServerLoad = async ({ cookies, fetch, locals, url }) => {
	await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);
	const queryEmail = url.searchParams.get('userEmail')?.trim().toLowerCase() ?? '';
	const storedEmail = readSignupAccount(cookies)?.userEmail.trim().toLowerCase() ?? '';
	return {
		userEmail: queryEmail || storedEmail
	};
};

export const actions = {
	confirm: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const formData = await request.formData();
		const userEmail = readEmail(formData);
		const confirmationCode = String(formData.get('confirmationCode') ?? '').replace(/\D/g, '');

		const parsed = v.safeParse(ConfirmSignUpRequestSchema, { userEmail, confirmationCode });
		if (!parsed.success) {
			const message = parsed.issues[0]?.message ?? 'Enter the 6-digit code.';
			const isEmailIssue = parsed.issues[0]?.path?.[0]?.key === 'userEmail';
			return fail(400, {
				userEmail,
				confirmationCode,
				codeError: isEmailIssue ? undefined : message,
				emailError: isEmailIssue ? message : undefined
			});
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
				userEmail: parsed.output.userEmail,
				confirmationCode: parsed.output.confirmationCode,
				codeError: result.message
			});
		}

		redirect(303, '/login');
	},

	resend: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const formData = await request.formData();
		const userEmail = readEmail(formData);
		const confirmationCode = String(formData.get('confirmationCode') ?? '').replace(/\D/g, '');

		const parsed = v.safeParse(ResendSignUpConfirmationRequestSchema, { userEmail });
		if (!parsed.success) {
			return fail(400, {
				userEmail,
				confirmationCode,
				resendError: parsed.issues[0]?.message ?? 'Enter a valid email.',
				resendFailed: true
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
				userEmail: parsed.output.userEmail,
				confirmationCode,
				resendError: result.message,
				resendFailed: true
			});
		}

		return {
			userEmail: parsed.output.userEmail,
			confirmationCode,
			resendSuccess: true as const,
			message: result.message
		};
	}
} satisfies Actions;
