import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { createOrganizationShell, organizations } from '$lib/data/mockData';
import { applyOrganizationCategory } from '$lib/organization/category';

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
			organization: applyOrganizationCategory(seeded, data.resolvedCategory ?? seeded.category),
			loadError: data.loadError
		};
	}

	if (data.allowShell) {
		return {
			organization: createOrganizationShell({
				id: orgId,
				category: data.resolvedCategory ?? 'MERCHANT'
			}),
			loadError: data.loadError
		};
	}

	error(404, 'Organization not found');
};
