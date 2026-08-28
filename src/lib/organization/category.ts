import type { Organization, OrganizationCategory, OrganizationDocument } from '$lib/data/mockData';

export function parseOrganizationCategory(
	value: string | null | undefined
): OrganizationCategory | null {
	const normalized = value?.trim().toUpperCase();
	if (normalized === 'PARTNER') return 'PARTNER';
	if (normalized === 'PLATFORM') return 'PLATFORM';
	if (normalized === 'MERCHANT') return 'MERCHANT';
	return null;
}

/** Partner and platform share the same onboarding UI (brand name, brand logo, activate). */
export function isPartnerStyleCategory(
	category: string | null | undefined
): category is 'PARTNER' | 'PLATFORM' {
	const normalized = category?.trim().toUpperCase();
	return normalized === 'PARTNER' || normalized === 'PLATFORM';
}

export function resolveOrganizationCategory(input: {
	fromUrl?: string | null;
	fromMemory?: string | null;
	fromMock?: OrganizationCategory | null;
	fromApi?: OrganizationCategory | null;
}): OrganizationCategory {
	return (
		parseOrganizationCategory(input.fromUrl) ??
		parseOrganizationCategory(input.fromMemory) ??
		(isPartnerStyleCategory(input.fromMock) ? input.fromMock : null) ??
		(isPartnerStyleCategory(input.fromApi) ? input.fromApi : null) ??
		input.fromApi ??
		input.fromMock ??
		'MERCHANT'
	);
}

function pendingBrandLogo(): OrganizationDocument {
	return {
		id: 'brand-logo',
		documentType: 'Brand logo',
		fileName: '',
		status: 'Pending'
	};
}

export function applyOrganizationCategory(
	organization: Organization,
	category: OrganizationCategory
): Organization {
	const kyb = {
		...organization.kyb,
		brandName: organization.kyb.brandName ?? ''
	};

	if (!isPartnerStyleCategory(category)) {
		return {
			...organization,
			category,
			kyb
		};
	}

	const hasBrandLogo = organization.documents.some(
		(document) => document.documentType === 'Brand logo'
	);

	return {
		...organization,
		category,
		kyb,
		documents: hasBrandLogo
			? organization.documents
			: [...organization.documents, pendingBrandLogo()]
	};
}
