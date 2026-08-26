import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Organization, OrganizationCategory } from '$lib/data/mockData';
import { organizations, createOrganizationShell } from '$lib/data/mockData';
import { applyOrganizationCategory, resolveOrganizationCategory } from '$lib/organization/category';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapGetOrganizationResponse } from '$lib/server/domains/organization/mappers/from-api/get-organization';
import {
	readRememberedOrgCategory,
	rememberOrgCategory
} from '$lib/server/domains/organization/utils/org-category-cookie';
import {
	readRememberedOrgBrandName,
	rememberOrgBrandName
} from '$lib/server/domains/organization/utils/org-brand-name-cookie';
import { resolveOrganizationDisplayName } from '$lib/server/domains/organization/utils/resolve-display-name';

function withResolvedCategory(
	organization: Organization | null,
	category: OrganizationCategory,
	rememberedBrandName = ''
): Organization | null {
	if (!organization) return null;
	const next = applyOrganizationCategory(organization, category);
	if (next.kyb.brandName.trim()) return next;
	if (!rememberedBrandName.trim()) return next;
	return {
		...next,
		kyb: {
			...next.kyb,
			brandName: rememberedBrandName.trim()
		}
	};
}

function fallbackOrganization(orgId: string, mockOrganization: Organization | null): Organization {
	return mockOrganization ?? createOrganizationShell({ id: orgId });
}

type OrganizationLayoutData = {
	organization: Organization | null;
	orgId: string;
	allowShell: boolean;
	resolvedCategory: OrganizationCategory;
	loadError: string | null;
};

export const load: LayoutServerLoad = async ({
	params,
	url,
	cookies,
	fetch,
	locals,
	depends
}): Promise<OrganizationLayoutData> => {
	depends('org');

	const log = locals.logger;
	const orgId = params.orgId?.trim();

	if (!orgId) {
		error(404, 'Organization not found');
	}

	const mockOrganization = organizations.find((candidate) => candidate.id === orgId) ?? null;
	const rememberedBrandName = readRememberedOrgBrandName(cookies, orgId);
	const rememberedCategory = readRememberedOrgCategory(cookies, orgId);

	const resolveCategory = (fromApi: OrganizationCategory | null = null): OrganizationCategory => {
		const category = resolveOrganizationCategory({
			fromUrl: url.searchParams.get('category'),
			fromMemory: rememberedCategory,
			fromMock: mockOrganization?.category ?? null,
			fromApi
		});
		rememberOrgCategory(cookies, orgId, category);
		return category;
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			const resolvedCategory = resolveCategory(null);
			return {
				organization: withResolvedCategory(
					fallbackOrganization(orgId, mockOrganization),
					resolvedCategory,
					rememberedBrandName
				),
				orgId,
				allowShell: true,
				resolvedCategory,
				loadError: e.message
			};
		}
		throw e;
	}

	const detailsResult = await organizationClient.getDetails(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	let organization = fallbackOrganization(orgId, mockOrganization);
	let allowShell = true;
	let loadError: string | null;
	let categoryFromApi: OrganizationCategory | null = null;

	if (detailsResult.ok) {
		const mapped = mapGetOrganizationResponse(detailsResult.data, orgId);
		if (mapped) {
			organization = mapped;
			allowShell = false;
			loadError = null;
			categoryFromApi = mapped.category;
			if (mapped.kyb.brandName.trim()) {
				rememberOrgBrandName(cookies, orgId, mapped.kyb.brandName);
			}
		} else {
			log.warn(
				{ orgId, upstream: detailsResult.data },
				'GET organization details returned unmapped payload'
			);
			loadError = 'Unexpected organization details response shape';
		}
	} else {
		const status = detailsResult.error.kind === 'http' ? detailsResult.error.status : undefined;
		const exceptionCode =
			detailsResult.error.kind === 'http' ? detailsResult.error.code : undefined;

		log.warn(
			{
				orgId,
				kind: detailsResult.error.kind,
				status,
				exceptionCode,
				message: detailsResult.error.message
			},
			'GET organization details failed'
		);
		loadError = detailsResult.error.message;
	}

	organization = await resolveOrganizationDisplayName({
		organization,
		orgId,
		fetch,
		log,
		accessToken: tokens.accessToken,
		gatewayToken: tokens.gatewayToken
	});

	const resolvedCategory = resolveCategory(categoryFromApi);
	return {
		organization: withResolvedCategory(organization, resolvedCategory, rememberedBrandName),
		orgId,
		allowShell,
		resolvedCategory,
		loadError
	};
};
