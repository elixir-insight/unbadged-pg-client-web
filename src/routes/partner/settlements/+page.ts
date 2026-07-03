import type { PageLoad } from './$types';
import { fetchPartnerSettlements } from './data';

export const load: PageLoad = async ({ url, depends }) => {
	depends('partner:settlements');

	const search = url.searchParams.get('search')?.trim() ?? '';

	try {
		const settlements = await fetchPartnerSettlements({ search });
		return { settlements, loadError: null as string | null };
	} catch {
		return {
			settlements: null,
			loadError: 'Unable to load settlement merchants. Please try again.'
		};
	}
};
