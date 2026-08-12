import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { defaultOrganizationLandingPath } from './helpers';

export const load: PageLoad = async ({ params, url, parent }) => {
	const { organization } = await parent();
	const orgId = params.orgId?.trim() ?? '';
	const category = url.searchParams.get('category');
	const categoryQuery = category ? `?category=${encodeURIComponent(category)}` : '';

	if (!orgId || !organization) {
		redirect(307, `/management/organizations/${orgId}/kyb${categoryQuery}`);
	}

	redirect(307, `${defaultOrganizationLandingPath(orgId, organization.status)}${categoryQuery}`);
};
