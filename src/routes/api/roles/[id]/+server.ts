import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';
import type { RoleDetail } from '$lib/stores/role-management/role-management';

export const GET: RequestHandler = async ({ params, url, request, cookies, fetch, locals }) => {
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

	const roleId = Number(params.id);
	if (!Number.isFinite(roleId)) {
		error(400, { message: 'Invalid role id' });
	}

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
