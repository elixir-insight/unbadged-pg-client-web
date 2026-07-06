import type { PageLoad } from './$types';
import { fetchCommissions } from './data';

export const load: PageLoad = async ({ url }) => {
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';
	const merchant = url.searchParams.get('merchant') ?? '';
	const paymentMethod = url.searchParams.get('paymentMethod') ?? '';
	const search = url.searchParams.get('search')?.trim() ?? '';
	const searchField =
		url.searchParams.get('searchField') === 'merchant' ? 'merchant' : 'transactionRef';

	const commissions = await fetchCommissions({
		dateFrom,
		dateTo,
		merchant,
		paymentMethod,
		search,
		searchField
	});

	return { commissions };
};
