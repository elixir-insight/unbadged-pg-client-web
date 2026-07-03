import type { PageLoad } from './$types';
import { fetchCommissions } from './data';

export const load: PageLoad = async ({ url }) => {
	const date = url.searchParams.get('date') ?? '';
	const merchant = url.searchParams.get('merchant') ?? '';

	const commissions = await fetchCommissions({ date, merchant });

	return { commissions };
};
