import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { RoleDetail } from '$lib/stores/role-management/role-management';
import type { ApiPermissionModule } from '$lib/stores/role-management/permissions-mapper';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	requirePermission(locals.userPermissions, 'ROLE_MANAGEMENT', 'read');
	const [roleRes, permsRes] = await Promise.all([
		fetch(`/api/roles/${params.id}?portal=management`),
		fetch('/api/roles/permissions?portal=management')
	]);

	if (!roleRes.ok) error(404, 'Role not found');
	if (!permsRes.ok) error(permsRes.status, 'Failed to load permissions');

	const role: RoleDetail = await roleRes.json();
	const permsBody: { modules: ApiPermissionModule[] } = await permsRes.json();

	return {
		role,
		permissionModules: permsBody?.modules ?? []
	};
};
