import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { defaultOrganizationLandingPath } from './helpers';

export const load: PageLoad = async ({ params, parent, url }) => {
	const { organization } = await parent();
	const orgId = params.orgId?.trim() ?? '';
	const query = url.searchParams.toString();
	const suffix = query ? `?${query}` : '';

	if (!orgId || !organization) {
		redirect(307, `/management/organizations/${orgId}/kyb${suffix}`);
	}

	redirect(307, `${defaultOrganizationLandingPath(orgId, organization.status)}${suffix}`);
};
