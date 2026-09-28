import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadChargebacksByOrganization } from '$lib/server/domains/dispute/loaders/list-chargebacks-by-organization';
import {
	emptyDisputePagination,
	type ChargebackDetailRow
} from '$lib/server/domains/dispute/mappers/from-api/chargeback-detail';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('merchant-chargebacks:list');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const log = locals.logger.child({ action: 'merchant-chargebacks-list' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const orgId =
		locals.merchantSession?.displayOrgId?.trim() ||
		locals.merchantSession?.organizationId?.trim() ||
		'';

	const empty = {
		rows: [] as ChargebackDetailRow[],
		pagination: emptyDisputePagination(limit, page),
		orgId,
		listError: null as string | null
	};

	if (!orgId) {
		return {
			...empty,
			listError: 'Organization id is unavailable for this session.'
		};
	}

	const result = await loadChargebacksByOrganization({
		fetch,
		log,
		cookies,
		orgId,
		limit,
		page,
		portal: 'merchant'
	});

	return {
		rows: result.rows,
		pagination: result.pagination,
		orgId,
		listError: result.listError
	};
};
