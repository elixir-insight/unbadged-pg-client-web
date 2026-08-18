import type { Organization } from '$lib/data/mockData';

export function isOrganizationNamePlaceholder(name: string, orgId: string): boolean {
	const trimmed = name.trim();
	return !trimmed || trimmed === orgId;
}

export function hasPersistedOrganizationName(
	organization: Pick<Organization, 'name' | 'kyb'>,
	orgId: string
): boolean {
	return (
		!isOrganizationNamePlaceholder(organization.name, orgId) ||
		!isOrganizationNamePlaceholder(organization.kyb.legalCompanyName, orgId)
	);
}

/** Overlay a display name when onboard details only return orgId. */
export function applyPendingOrganizationName(
	organization: Organization,
	displayName: string | null | undefined,
	orgId: string
): Organization {
	const name = displayName?.trim();
	if (!name) return organization;

	if (
		!isOrganizationNamePlaceholder(organization.name, orgId) &&
		!isOrganizationNamePlaceholder(organization.kyb.legalCompanyName, orgId)
	) {
		return organization;
	}

	return {
		...organization,
		name,
		kyb: {
			...organization.kyb,
			legalCompanyName: name
		}
	};
}
