import { fail, type ActionFailure } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { hasUnapprovedGroup } from '$lib/stores/auth/portal';

export type OnboardingTokens = { accessToken: string; gatewayToken: string };

type GuardResult =
	{ ok: true; tokens: OnboardingTokens } | { ok: false; failure: ActionFailure<{ error: string }> };

/**
 * Same guard the self-onboarding proxy applied per request, now shared by every onboarding form
 * action: only orgs pending approval may call these endpoints, and only with a valid (or
 * refreshed) session.
 */
export async function requireOnboardingSession(params: {
	cookies: Cookies;
	fetch: typeof fetch;
	log: Logger;
	groups: string[] | null | undefined;
}): Promise<GuardResult> {
	if (!hasUnapprovedGroup(params.groups)) {
		return {
			ok: false,
			failure: fail(403, { error: 'Onboarding is not available for this account' })
		};
	}
	try {
		const tokens = await getValidSession(params.cookies, params.fetch, params.log);
		return { ok: true, tokens };
	} catch (cause) {
		if (cause instanceof SessionError) {
			return { ok: false, failure: fail(401, { error: 'Unauthorized' }) };
		}
		throw cause;
	}
}
