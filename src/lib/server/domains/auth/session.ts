import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_OPTS = {
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'strict' as const
};

export function storeSession(
	cookies: Cookies,
	tokens: { accessToken: string; gatewayToken: string; idToken: string; refreshToken: string }
) {
	cookies.set('accessToken', tokens.accessToken, COOKIE_OPTS);
	cookies.set('gatewayToken', tokens.gatewayToken, COOKIE_OPTS);
	cookies.set('idToken', tokens.idToken, COOKIE_OPTS);
	// Placeholder maxAge — confirm against the live refresh token `exp` later.
	cookies.set('refreshToken', tokens.refreshToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7 });
}

const PW_CHALLENGE_COOKIE = 'pwChallenge';
const MFA_CHALLENGE_COOKIE = 'mfaChallenge';

/**
 * Short-lived challenge from a "Password change required" (202) sign-in.
 * Stored server-side (httpOnly) so /reset-temporary-password can complete it
 * without exposing the token to the browser.
 */
export function storePasswordChallenge(
	cookies: Cookies,
	data: { userEmail: string; challengeSession: string }
) {
	cookies.set(PW_CHALLENGE_COOKIE, JSON.stringify(data), { ...COOKIE_OPTS, maxAge: 60 * 10 });
}

export function readPasswordChallenge(
	cookies: Cookies
): { userEmail: string; challengeSession: string } | null {
	const raw = cookies.get(PW_CHALLENGE_COOKIE);
	if (!raw) return null;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			parsed &&
			typeof parsed === 'object' &&
			'userEmail' in parsed &&
			'challengeSession' in parsed &&
			typeof parsed.userEmail === 'string' &&
			typeof parsed.challengeSession === 'string'
		) {
			return { userEmail: parsed.userEmail, challengeSession: parsed.challengeSession };
		}
		return null;
	} catch {
		return null;
	}
}

export function clearPasswordChallenge(cookies: Cookies) {
	cookies.delete(PW_CHALLENGE_COOKIE, { path: '/' });
}

export type StoredMfaChallenge = {
	userEmail: string;
	challengeName: 'EMAIL_OTP' | 'SMS_MFA';
	challengeSession: string;
	challengeDestination: string;
	challengeExpiresIn: number;
};

/** Short-lived MFA challenge from a 202 sign-in — kept httpOnly until OTP verify. */
export function storeMfaChallenge(cookies: Cookies, data: StoredMfaChallenge) {
	const maxAge = Math.max(30, Math.min(data.challengeExpiresIn || 180, 60 * 10));
	cookies.set(MFA_CHALLENGE_COOKIE, JSON.stringify(data), { ...COOKIE_OPTS, maxAge });
}

export function readMfaChallenge(cookies: Cookies): StoredMfaChallenge | null {
	const raw = cookies.get(MFA_CHALLENGE_COOKIE);
	if (!raw) return null;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			parsed &&
			typeof parsed === 'object' &&
			'userEmail' in parsed &&
			'challengeName' in parsed &&
			'challengeSession' in parsed &&
			'challengeDestination' in parsed &&
			'challengeExpiresIn' in parsed &&
			typeof parsed.userEmail === 'string' &&
			(parsed.challengeName === 'EMAIL_OTP' || parsed.challengeName === 'SMS_MFA') &&
			typeof parsed.challengeSession === 'string' &&
			typeof parsed.challengeDestination === 'string' &&
			typeof parsed.challengeExpiresIn === 'number'
		) {
			return {
				userEmail: parsed.userEmail,
				challengeName: parsed.challengeName,
				challengeSession: parsed.challengeSession,
				challengeDestination: parsed.challengeDestination,
				challengeExpiresIn: parsed.challengeExpiresIn
			};
		}
		return null;
	} catch {
		return null;
	}
}

export function clearMfaChallenge(cookies: Cookies) {
	cookies.delete(MFA_CHALLENGE_COOKIE, { path: '/' });
}

export function clearAuthCookies(cookies: Cookies) {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('gatewayToken', { path: '/' });
	cookies.delete('idToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
	// Leftover pre-auth signup cookie would reopen /confirm-email after logout.
	cookies.delete('signupAccount', { path: '/' });
}
