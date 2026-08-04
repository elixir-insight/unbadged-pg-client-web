import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getInsightsMerchantById, getMockDaySummaries } from '$lib/components/transaction-insights';
import { today, getLocalTimeZone } from '@internationalized/date';

export const load: PageLoad = async ({ params, url }) => {
	const merchant = getInsightsMerchantById(params.merchantId);
	if (!merchant) {
		error(404, { message: 'Merchant not found' });
	}

	const now = today(getLocalTimeZone());
	const yearParam = Number(url.searchParams.get('year'));
	const monthParam = Number(url.searchParams.get('month'));
	const year = Number.isInteger(yearParam) && yearParam > 2000 ? yearParam : now.year;
	const month =
		Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : now.month;

	// TODO: replace with merchant Transaction Insights calendar API when available.
	return {
		merchant: { ...merchant },
		year,
		month,
		daySummaries: getMockDaySummaries(merchant.id, year, month)
	};
};
