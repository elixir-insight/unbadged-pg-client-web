import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { authClient } from './client';
import { toE164IndianPhone } from '$lib/server/domains/organization/mappers/to-api/create-organization';
import type { SignUpBody } from '$lib/validation/sign-up';

const FALLBACK_MESSAGE = 'Something went wrong. Try again.';
const SIGNUP_ACCOUNT_COOKIE = 'signupAccount';

const COOKIE_OPTS = {
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'strict' as const
};

export type SignUpAccount = {
	orgId: string;
	userEmail: string;
};

export type SignUpSuccess = {
	ok: true;
	orgId: string;
	userEmail: string;
	message: string;
};

export type SignUpFailure = {
	ok: false;
	status: number;
	message: string;
};

export type SignUpResult = SignUpSuccess | SignUpFailure;

/** Persist signup result the same way other pre-auth auth cookies are stored. */
export function storeSignupAccount(cookies: Cookies, data: SignUpAccount) {
	cookies.set(SIGNUP_ACCOUNT_COOKIE, JSON.stringify(data), { ...COOKIE_OPTS, maxAge: 60 * 60 });
}

export function readSignupAccount(cookies: Cookies): SignUpAccount | null {
	const raw = cookies.get(SIGNUP_ACCOUNT_COOKIE);
	if (!raw) return null;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			parsed &&
			typeof parsed === 'object' &&
			'orgId' in parsed &&
			'userEmail' in parsed &&
			typeof parsed.orgId === 'string' &&
			typeof parsed.userEmail === 'string'
		) {
			return { orgId: parsed.orgId, userEmail: parsed.userEmail };
		}
		return null;
	} catch {
		return null;
	}
}

function resolveErrorMessage(message: string | undefined): string {
	const trimmed = message?.trim();
	return trimmed ? trimmed : FALLBACK_MESSAGE;
}

export async function performSignUp(opts: {
	fetch: typeof fetch;
	cookies: Cookies;
	logger: Logger;
	ip: string;
	body: SignUpBody;
}): Promise<SignUpResult> {
	const { fetch: fetchFn, cookies, logger: log, ip, body } = opts;
	log.info({ ip, userEmail: body.userEmail }, 'sign-up attempt');

	const result = await authClient.signUp(fetchFn, log, {
		legalCompanyName: body.legalCompanyName,
		businessType: body.businessType,
		userEmail: body.userEmail,
		phoneNumber: toE164IndianPhone(body.phoneNumber),
		password: body.password,
		affiliateId: ''
	});

	if (!result.ok) {
		const status =
			result.error.kind === 'http' && result.error.status >= 400 && result.error.status < 500
				? result.error.status
				: 502;
		const message =
			result.error.kind === 'http' ? resolveErrorMessage(result.error.message) : FALLBACK_MESSAGE;
		log.warn(
			{ ip, userEmail: body.userEmail, errorKind: result.error.kind, status },
			'sign-up failed'
		);
		return { ok: false, status, message };
	}

	if (result.data.statusCode !== 201) {
		const message = resolveErrorMessage(result.data.message);
		log.warn(
			{ ip, userEmail: body.userEmail, statusCode: result.data.statusCode },
			'sign-up failed — unexpected statusCode'
		);
		return { ok: false, status: 502, message };
	}

	const item = result.data.data[0];
	if (!item) {
		log.error({ ip, userEmail: body.userEmail }, 'sign-up succeeded but no account returned');
		return { ok: false, status: 502, message: FALLBACK_MESSAGE };
	}

	storeSignupAccount(cookies, { orgId: item.orgId, userEmail: item.userEmail });
	log.info({ ip, userEmail: item.userEmail, orgId: item.orgId }, 'sign-up succeeded');
	return {
		ok: true,
		orgId: item.orgId,
		userEmail: item.userEmail,
		message: resolveErrorMessage(result.data.message)
	};
}

export type ConfirmSignUpSuccess = { ok: true; message: string };
export type ConfirmSignUpFailure = { ok: false; status: number; message: string };
export type ConfirmSignUpResult = ConfirmSignUpSuccess | ConfirmSignUpFailure;

function mapAuthCallFailure(
	error: { kind: string; status?: number; message: string },
	log: Logger,
	ip: string,
	userEmail: string,
	action: 'confirm' | 'resend'
): ConfirmSignUpFailure {
	const status =
		error.kind === 'http' && error.status && error.status >= 400 && error.status < 500
			? error.status
			: 502;
	const message = error.kind === 'http' ? resolveErrorMessage(error.message) : FALLBACK_MESSAGE;
	log.warn({ ip, userEmail, errorKind: error.kind, status }, `sign-up ${action} failed`);
	return { ok: false, status, message };
}

export async function performConfirmSignUp(opts: {
	fetch: typeof fetch;
	logger: Logger;
	ip: string;
	userEmail: string;
	confirmationCode: string;
}): Promise<ConfirmSignUpResult> {
	const { fetch: fetchFn, logger: log, ip, userEmail, confirmationCode } = opts;
	log.info({ ip, userEmail }, 'sign-up confirm attempt');

	const result = await authClient.confirmSignup(fetchFn, log, { userEmail, confirmationCode });
	if (!result.ok) {
		return mapAuthCallFailure(result.error, log, ip, userEmail, 'confirm');
	}
	if (result.data.statusCode !== 200) {
		const message = resolveErrorMessage(result.data.message);
		log.warn(
			{ ip, userEmail, statusCode: result.data.statusCode },
			'sign-up confirm failed — unexpected statusCode'
		);
		return { ok: false, status: 502, message };
	}

	log.info({ ip, userEmail }, 'sign-up confirm succeeded');
	return { ok: true, message: resolveErrorMessage(result.data.message) };
}

export async function performResendSignUpConfirmation(opts: {
	fetch: typeof fetch;
	logger: Logger;
	ip: string;
	userEmail: string;
}): Promise<ConfirmSignUpResult> {
	const { fetch: fetchFn, logger: log, ip, userEmail } = opts;
	log.info({ ip, userEmail }, 'sign-up resend confirmation attempt');

	const result = await authClient.resendConfirmationCode(fetchFn, log, { userEmail });
	if (!result.ok) {
		return mapAuthCallFailure(result.error, log, ip, userEmail, 'resend');
	}
	if (result.data.statusCode !== 200) {
		const message = resolveErrorMessage(result.data.message);
		log.warn(
			{ ip, userEmail, statusCode: result.data.statusCode },
			'sign-up resend failed — unexpected statusCode'
		);
		return { ok: false, status: 502, message };
	}

	log.info({ ip, userEmail }, 'sign-up resend confirmation succeeded');
	return { ok: true, message: resolveErrorMessage(result.data.message) };
}
