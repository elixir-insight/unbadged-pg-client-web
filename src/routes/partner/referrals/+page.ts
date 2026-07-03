import type { PageLoad } from './$types';
import { fetchReferrals } from './data';

export const load: PageLoad = async ({ url }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';
	const skip = Number(url.searchParams.get('skip') ?? 0);
	const limit = Number(url.searchParams.get('limit') ?? 8);
	const page = Math.floor(skip / limit) + 1;

	const referrals = await fetchReferrals({ status, search, page });

	return { referrals };
};
