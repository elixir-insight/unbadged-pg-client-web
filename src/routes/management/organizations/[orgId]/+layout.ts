import { error } from '@sveltejs/kit';
import { organizations } from '$lib/data/mockData';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	const organization = organizations.find((candidate) => candidate.id === params.orgId);
	if (!organization) {
		error(404, 'Organization not found');
	}
	return { organization };
};
