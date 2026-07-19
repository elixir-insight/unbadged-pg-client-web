import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';
import type { RoleItem } from '$lib/stores/role-management/role-management';

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

	const orgId = Number(locals.merchantSession?.organizationId);
	if (!Number.isFinite(orgId)) {
		error(401, { message: 'Organization not found in session' });
	}

	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
	// Upstream roles list uses 0-based page indexing.
	const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
	const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 100) || 100);

	const result = await membersClient.listOrgRoles(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		{ page, limit },
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	const items: RoleItem[] = (result.data?.data ?? []).filter((role) =>
		query ? role.roleName.toLowerCase().includes(query) : true
	);

	return json({
		items,
		pagination: result.data?.pagination ?? { total: 0, page: 0, limit: 0 },
		message: result.data?.message ?? '',
		statusCode: result.data?.statusCode ?? 200
	});
};
