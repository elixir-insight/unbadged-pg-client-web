import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';

async function requireSession(cookies: Cookies, fetchFn: typeof fetch, logger: Logger) {
	try {
		return await getValidSession(cookies, fetchFn, logger);
	} catch (e) {
		if (e instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw e;
	}
}

/** Lightweight user directory for reporting-to pickers and name lookup. */
export const GET: RequestHandler = async ({ url, request, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);
	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const result = await membersClient.listUsers(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		{ page: 0, limit: 1000 },
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json({
		items: result.data.data.map((user) => ({
			id: String(user.id),
			name: user.userName
		}))
	});
};
