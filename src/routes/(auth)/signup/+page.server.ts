import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { SignUpRequestSchema } from '$lib/server/domains/auth/schema';
import { performSignUp } from '$lib/server/domains/auth/sign-up';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies } from '$lib/server/domains/auth/session';
import { decodeJwt } from '$lib/server/domains/auth/jwt';
import { collectPortalGroups, resolvePortalHome } from '$lib/stores/auth/portal';
import type { AccessTokenPayload, GatewayTokenPayload } from '$lib/stores/auth/types';
import { validateSignUp, type SignUpInput } from '$lib/validation/sign-up';

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
		logger.info({ home, groups }, 'signed-in user hit signup — redirecting to portal home');
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

function readSignupFields(formData: FormData): SignUpInput {
	return {
		legalCompanyName: String(formData.get('legalCompanyName') ?? ''),
		businessType: String(formData.get('businessType') ?? ''),
		userEmail: String(formData.get('userEmail') ?? ''),
		phoneNumber: String(formData.get('phoneNumber') ?? ''),
		password: String(formData.get('password') ?? ''),
		affiliateId: ''
	};
}

function publicFields(raw: SignUpInput) {
	return {
		legalCompanyName: raw.legalCompanyName,
		businessType: raw.businessType,
		userEmail: raw.userEmail.trim().toLowerCase(),
		phoneNumber: raw.phoneNumber
	};
}

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);
	return {};
};

export const actions = {
	signup: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		await redirectIfAlreadySignedIn(cookies, fetch, locals.logger);

		const log = locals.logger;
		const ip = getClientAddress();
		const raw = readSignupFields(await request.formData());
		const fields = publicFields(raw);

		const parsed = v.safeParse(SignUpRequestSchema, raw);
		if (!parsed.success) {
			const errors = validateSignUp(raw);
			log.warn({ ip, issues: parsed.issues }, 'sign-up rejected — invalid request body');
			return fail(400, {
				...fields,
				errors
			});
		}

		const result = await performSignUp({
			fetch,
			cookies,
			logger: log,
			ip,
			body: parsed.output
		});

		if (!result.ok) {
			return fail(result.status, {
				...fields,
				message: result.message
			});
		}

		redirect(303, `/confirm-signup?userEmail=${encodeURIComponent(result.userEmail)}`);
	}
} satisfies Actions;
