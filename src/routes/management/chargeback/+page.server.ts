import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadChargebackOverview } from '$lib/server/domains/dispute/loaders/list-chargeback-overview';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('management-chargebacks:overview');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const log = locals.logger.child({ action: 'management-chargebacks-overview' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);

	const result = await loadChargebackOverview({
		fetch,
		log,
		cookies,
		limit,
		page
	});

	return {
		rows: result.rows,
		pagination: result.pagination,
		listError: result.listError
	};
};
