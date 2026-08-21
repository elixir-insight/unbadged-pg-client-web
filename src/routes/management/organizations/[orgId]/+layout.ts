import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import {
	createOrganizationShell,
	organizations,
	type OrganizationCategory
} from '$lib/data/mockData';
import { applyOrganizationCategory, parseOrganizationCategory } from '$lib/organization/category';

function layoutCategory(
	value: string | null | undefined,
	fallback: OrganizationCategory
): OrganizationCategory {
	return parseOrganizationCategory(value) ?? fallback;
}

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
			organization: applyOrganizationCategory(
				seeded,
				layoutCategory(data.resolvedCategory, seeded.category)
			),
			loadError: data.loadError
		};
	}

	if (data.allowShell) {
		return {
			organization: createOrganizationShell({
				id: orgId,
				category: layoutCategory(data.resolvedCategory, 'MERCHANT')
			}),
			loadError: data.loadError
		};
	}

	error(404, 'Organization not found');
};
