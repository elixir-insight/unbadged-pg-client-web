import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { RoleDetail } from '$lib/stores/role-management/role-management';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/roles/${params.id}`);
	if (!res.ok) error(404, 'Role not found');
	const role: RoleDetail = await res.json();
	return { role };
};
