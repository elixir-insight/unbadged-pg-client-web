import type { PageLoad } from './$types';
import { fetchDashboardSummary } from './data';

export const load: PageLoad = async ({ depends }) => {
	depends('partner:dashboard');

	const dashboard = await fetchDashboardSummary();

	return { dashboard };
};
