import type { Organization, OrganizationCategory, OrganizationDocument } from '$lib/data/mockData';

export function parseOrganizationCategory(
	value: string | null | undefined
): OrganizationCategory | null {
	const normalized = value?.trim().toUpperCase();
	if (normalized === 'PARTNER') return 'PARTNER';
	if (normalized === 'MERCHANT') return 'MERCHANT';
	return null;
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
		(input.fromMock === 'PARTNER' ? 'PARTNER' : null) ??
		(input.fromApi === 'PARTNER' ? 'PARTNER' : null) ??
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

	if (category !== 'PARTNER') {
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
		category: 'PARTNER',
		kyb,
		documents: hasBrandLogo
			? organization.documents
			: [...organization.documents, pendingBrandLogo()]
	};
}
