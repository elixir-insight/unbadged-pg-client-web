import type { PageServerLoad } from './$types';
import { requireAnyPermission } from '$lib/server/domains/auth/requirePermission';

export const load: PageServerLoad = ({ locals }) => {
	requireAnyPermission(locals.userPermissions, [
		{ module: 'PAYINS', action: 'read' },
		{ module: 'PAYOUTS', action: 'read' }
	]);
	return {};
};
