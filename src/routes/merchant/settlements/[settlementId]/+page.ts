import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getSettlement } from '$lib/data/settlement-mock';

// Swap for a real API call later, e.g.:
// const settlement = await fetch(`/api/merchant/settlements/${params.settlementId}`).then((r) => r.json());
export const load: PageLoad = async ({ params }) => {
	const settlement = getSettlement(params.settlementId);
	if (!settlement) error(404, 'Settlement not found');
	return { settlement };
};
