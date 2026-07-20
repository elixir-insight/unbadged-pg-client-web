import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { createOrganizationShell, organizations } from '$lib/data/mockData';

export const load: LayoutLoad = ({ data, params }) => {
	if (data.organization) {
		return {
			organization: data.organization,
			loadError: data.loadError
		};
	}

	const orgId = params.orgId?.trim() || data.orgId;
	if (!orgId) {
		error(404, 'Organization not found');
	}

	const seeded = organizations.find((candidate) => candidate.id === orgId);
	if (seeded) {
		return {
			organization: seeded,
			loadError: data.loadError
		};
	}

	if (data.allowShell) {
		return {
			organization: createOrganizationShell({ id: orgId }),
			loadError: data.loadError
		};
	}

	error(404, 'Organization not found');
};
