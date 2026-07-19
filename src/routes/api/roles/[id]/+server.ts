import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';
import { UpdateOrgRoleBodySchema } from '$lib/server/domains/members/schema';
import type { RoleDetail } from '$lib/stores/role-management/role-management';

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

function parseRoleId(raw: string | undefined): number {
	const roleId = Number(raw);
	if (!Number.isFinite(roleId)) {
		error(400, { message: 'Invalid role id' });
	}
	return roleId;
}

export const GET: RequestHandler = async ({ params, url, request, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);

	const orgId = Number(locals.merchantSession?.organizationId);
	if (!Number.isFinite(orgId)) {
		error(401, { message: 'Organization not found in session' });
	}

	const roleId = parseRoleId(params.id);

	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const result = await membersClient.getOrgRole(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		roleId,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	const detail = result.data?.data?.[0];
	if (!detail) {
		error(404, { message: 'Role not found' });
	}

	const role: RoleDetail = {
		roleInfo: {
			roleId: detail.roleInfo?.roleId ?? roleId,
			roleName: detail.roleInfo?.roleName ?? '',
			description: detail.roleInfo?.description ?? '',
			roleAssignedCount: detail.roleInfo?.roleAssignedCount ?? 0,
			defaultRole: detail.roleInfo?.defaultRole ?? false
		},
		permissions: (detail.permissions ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description
		})),
		users: detail.users ?? []
	};

	return json(role);
};

export const PATCH: RequestHandler = async ({ params, url, request, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);

	const orgId = Number(locals.merchantSession?.organizationId);
	if (!Number.isFinite(orgId)) {
		error(401, { message: 'Organization not found in session' });
	}

	const roleId = parseRoleId(params.id);

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

	const parsed = v.safeParse(UpdateOrgRoleBodySchema, body);
	if (!parsed.success) {
		error(400, { message: 'Invalid update role payload' });
	}

	const result = await membersClient.updateOrgRole(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		roleId,
		parsed.output,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json({
		message: result.data?.message ?? 'Role updated successfully',
		statusCode: result.data?.statusCode ?? 200,
		data: result.data?.data ?? []
	});
};
