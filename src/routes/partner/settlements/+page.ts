import type { PageLoad } from './$types';
import { fetchPartnerSettlements } from './data';

export const load: PageLoad = async ({ url, depends }) => {
	depends('partner:settlements');

	const search = url.searchParams.get('search')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';
	const searchField = url.searchParams.get('searchField') === 'id' ? 'id' : 'name';

	try {
		const settlements = await fetchPartnerSettlements({ search, status, searchField });
		return { settlements, loadError: null as string | null };
	} catch {
		return {
			settlements: null,
			loadError: 'Unable to load settlement merchants. Please try again.'
		};
	}
};
