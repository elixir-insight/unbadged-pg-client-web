import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { OrganizationDetail } from '$lib/data/organization-detail';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/organizations/${params.orgId}`);
	if (!res.ok) error(404, 'Organization not found');
	const organization: OrganizationDetail = await res.json();
	return { organization };
};
