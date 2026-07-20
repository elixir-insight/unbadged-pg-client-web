import type { PageLoad } from './$types';
import { accountSettlementConfig, settlements } from '$lib/data/settlement-mock';

// Swap for real API calls later, e.g.:
// const settlements = await fetch('/api/merchant/settlements').then((r) => r.json());
export const load: PageLoad = async () => {
	return { settlements, accountSettlementConfig };
};
