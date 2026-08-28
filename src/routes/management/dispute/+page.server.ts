import type { PageServerLoad } from './$types';
import { loadDisputesByOrganization } from '$lib/server/domains/dispute/loaders/list-by-organization';
import {
	emptyDisputePagination,
	type DisputeListRow
} from '$lib/server/domains/dispute/mappers/from-api/list';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function resolveOrgId(
	raw: string | null,
	merchantOptions: { value: string; label: string }[]
): string {
	if (raw && merchantOptions.some((merchant) => merchant.value === raw)) return raw;
	return merchantOptions[0]?.value ?? '';
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends, parent }) => {
	depends('management-disputes:list');

	const parentData = await parent();
	const log = locals.logger.child({ action: 'management-disputes-list' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const status = url.searchParams.get('status')?.trim() || undefined;
	const source = url.searchParams.get('source')?.trim() || undefined;
	const orgId = resolveOrgId(url.searchParams.get('merchantId'), parentData.merchantOptions);

	const empty = {
		disputes: [] as DisputeListRow[],
		pagination: emptyDisputePagination(limit, page),
		orgId,
		listError: null as string | null
	};

	if (!orgId) {
		return {
			...empty,
			listError: parentData.merchantsError ?? 'No merchants are available.'
		};
	}

	const result = await loadDisputesByOrganization({
		fetch,
		log,
		cookies,
		orgId,
		query: { status, source, limit, page },
		statuses: parentData.statusOptions
	});

	return {
		disputes: result.disputes,
		pagination: result.pagination,
		orgId,
		listError: result.disputesError
	};
};
