import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { defaultOrganizationLandingPath } from './helpers';

export const load: PageLoad = async ({ params, parent }) => {
	const { organization } = await parent();
	const orgId = params.orgId?.trim() ?? '';

	if (!orgId || !organization) {
		redirect(307, `/management/organizations/${orgId}/kyb`);
	}

	redirect(307, defaultOrganizationLandingPath(orgId, organization.status));
};
