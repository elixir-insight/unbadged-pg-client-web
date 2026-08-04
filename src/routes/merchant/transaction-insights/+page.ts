import type { PageLoad } from './$types';
import { MOCK_INSIGHTS_MERCHANTS } from '$lib/components/transaction-insights';

export const load: PageLoad = async () => {
	// TODO: replace with merchant Transaction Insights API when available.
	return {
		merchants: MOCK_INSIGHTS_MERCHANTS.map((merchant) => ({ ...merchant }))
	};
};
