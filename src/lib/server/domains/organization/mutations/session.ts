import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import type { Logger } from 'pino';
import { mutationFailure, type MutationFailure, type MutationResult } from './types';

export type SessionTokens = {
	accessToken: string;
	gatewayToken: string;
};

export async function requireSession(params: {
	cookies: Parameters<typeof getValidSession>[0];
	fetch: typeof fetch;
	log: Logger;
}): Promise<MutationResult<SessionTokens>> {
	try {
		const tokens = await getValidSession(params.cookies, params.fetch, params.log);
		return {
			ok: true,
			accessToken: tokens.accessToken,
			gatewayToken: tokens.gatewayToken
		};
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return mutationFailure(401, e.message);
		}
		throw e;
	}
}

export function isSessionFailure(result: MutationResult<SessionTokens>): result is MutationFailure {
	return !result.ok;
}
