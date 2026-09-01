import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadPaymentLinksList } from '$lib/server/domains/payment-links/loaders/list';
import { mapPaymentLinkUiStatus } from '$lib/server/domains/payment-links/mappers/from-api/list';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('payment-links:list');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const log = locals.logger.child({ action: 'merchant-payment-links-list' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const orderId = url.searchParams.get('search')?.trim() || undefined;
	const statuses = mapPaymentLinkUiStatus(url.searchParams.get('status')?.trim() || undefined);

	return loadPaymentLinksList({
		fetch,
		log,
		cookies,
		query: { page, limit, orderId, statuses }
	});
};
