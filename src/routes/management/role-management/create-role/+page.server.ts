import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ApiPermissionModule } from '$lib/stores/role-management/permissions-mapper';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	requirePermission(locals.userPermissions, 'ROLE_MANAGEMENT', 'write');
	const res = await fetch('/api/roles/permissions?portal=management');
	if (!res.ok) {
		error(res.status, 'Failed to load permissions');
	}

	const body: { modules: ApiPermissionModule[] } = await res.json();
	return { permissionModules: body?.modules ?? [] };
};
