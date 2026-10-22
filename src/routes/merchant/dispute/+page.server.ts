import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadDisputesByOrganization } from '$lib/server/domains/dispute/loaders/list-by-organization';
import {
	emptyDisputePagination,
	type DisputeListRow
} from '$lib/server/domains/dispute/mappers/from-api/list';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('merchant-disputes:list');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const log = locals.logger.child({ action: 'merchant-disputes-list' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const status = url.searchParams.get('status')?.trim() || undefined;
	const source = url.searchParams.get('source')?.trim() || undefined;
	const orgId =
		locals.merchantSession?.displayOrgId?.trim() ||
		locals.merchantSession?.organizationId?.trim() ||
		'';

	const empty = {
		disputes: [] as DisputeListRow[],
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

	const result = await loadDisputesByOrganization({
		fetch,
		log,
		cookies,
		orgId,
		query: { status, source, limit, page },
		portal: 'merchant'
	});

	return {
		disputes: result.disputes,
		pagination: result.pagination,
		orgId,
		listError: result.disputesError
	};
};
