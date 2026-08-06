import type { PageLoad } from './$types';
import { fetchPartnerProfile } from './data';

export const load: PageLoad = async ({ depends }) => {
	depends('partner:profile');

	const profile = await fetchPartnerProfile();

	return { profile };
};
