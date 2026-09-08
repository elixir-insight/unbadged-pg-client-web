import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadChargebacksByOrganization } from '$lib/server/domains/dispute/loaders/list-chargebacks-by-organization';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ params, url, cookies, fetch, locals, depends }) => {
	depends('management-chargebacks:detail');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const orgId = params.orgId?.trim() ?? '';
	if (!orgId) {
		error(400, { message: 'Organization id is required' });
	}

	const log = locals.logger.child({ action: 'management-chargebacks-detail', orgId });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);

	const result = await loadChargebacksByOrganization({
		fetch,
		log,
		cookies,
		orgId,
		limit,
		page
	});

	return {
		orgId,
		rows: result.rows,
		pagination: result.pagination,
		listError: result.listError
	};
};
