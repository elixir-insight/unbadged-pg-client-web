import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';

export const GET: RequestHandler = async ({ url, request, cookies, fetch, locals }) => {
	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, locals.logger);
	} catch (e) {
		if (e instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw e;
	}

	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const result = await membersClient.listPermissions(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	const modules = result.data?.data?.[0]?.permissions ?? [];

	return json({
		modules,
		message: result.data?.message ?? '',
		statusCode: result.data?.statusCode ?? 200
	});
};
