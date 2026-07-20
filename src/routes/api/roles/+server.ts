import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';
import { CreateOrgRoleBodySchema } from '$lib/server/domains/members/schema';
import type { RoleItem } from '$lib/stores/role-management/role-management';

async function requireSession(
	cookies: Parameters<typeof getValidSession>[0],
	fetchFn: typeof fetch,
	logger: Parameters<typeof getValidSession>[2]
) {
	try {
		return await getValidSession(cookies, fetchFn, logger);
	} catch (e) {
		if (e instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw e;
	}
}

export const GET: RequestHandler = async ({ url, request, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);

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

export const POST: RequestHandler = async ({ request, url, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);

	const orgId = Number(locals.merchantSession?.organizationId);
	if (!Number.isFinite(orgId)) {
		error(401, { message: 'Organization not found in session' });
	}

	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, { message: 'Invalid JSON body' });
	}

	const parsed = v.safeParse(CreateOrgRoleBodySchema, body);
	if (!parsed.success) {
		error(400, { message: 'Invalid create role payload' });
	}

	const result = await membersClient.createOrgRole(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		parsed.output,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json(
		{
			message: result.data?.message ?? 'Role created successfully',
			statusCode: result.data?.statusCode ?? 201,
			data: result.data?.data ?? []
		},
		{ status: 201 }
	);
};
