import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ApiPermissionModule } from '$lib/stores/role-management/permissions-mapper';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/roles/permissions?portal=management');
	if (!res.ok) {
		error(res.status, 'Failed to load permissions');
	}

	const body: { modules: ApiPermissionModule[] } = await res.json();
	return { permissionModules: body?.modules ?? [] };
};
