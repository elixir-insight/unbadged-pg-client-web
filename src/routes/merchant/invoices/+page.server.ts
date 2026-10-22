import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadInvoicesList } from '$lib/server/domains/invoices/loaders/list';
import { mapInvoiceUiStatus } from '$lib/server/domains/invoices/mappers/from-api/list';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('invoices:list');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const log = locals.logger.child({ action: 'merchant-invoices-list' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const orderId = url.searchParams.get('search')?.trim() || undefined;
	const statuses = mapInvoiceUiStatus(url.searchParams.get('status')?.trim() || undefined);

	return loadInvoicesList({
		fetch,
		log,
		cookies,
		query: { page, limit, orderId, statuses }
	});
};
