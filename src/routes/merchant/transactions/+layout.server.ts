import type { LayoutServerLoad } from './$types';
import { requireAnyPermission } from '$lib/server/domains/auth/requirePermission';

/**
 * Guards every route under /merchant/transactions (collections, disbursements,
 * payins/[id]) — not just the /merchant/transactions landing page itself.
 */
export const load: LayoutServerLoad = ({ locals }) => {
	requireAnyPermission(locals.userPermissions, [
		{ module: 'PAYINS', action: 'read' },
		{ module: 'PAYOUTS', action: 'read' }
	]);
	return {};
};
