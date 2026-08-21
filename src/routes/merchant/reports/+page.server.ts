import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const load: PageServerLoad = ({ locals }) => {
	requirePermission(locals.userPermissions, 'REPORTS', 'read');
	return {};
};
