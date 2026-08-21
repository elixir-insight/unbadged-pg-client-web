import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { organizations, createOrganizationShell } from '$lib/data/mockData';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapGetOrganizationResponse } from '$lib/server/domains/organization/mappers/from-api/get-organization';
import { resolveOrganizationDisplayName } from '$lib/server/domains/organization/utils/resolve-display-name';

export const load: LayoutServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('org');
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'read');

	const log = locals.logger;
	const orgId = params.orgId?.trim();

	if (!orgId) {
		error(404, 'Organization not found');
	}

	const mockOrganization = organizations.find((candidate) => candidate.id === orgId) ?? null;

	// Partner onboarding isn't wired to the live API yet — always serve mock data.
	if (mockOrganization?.category === 'PARTNER') {
		return {
			organization: mockOrganization,
			orgId,
			allowShell: false,
			loadError: null
		};
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			const organization = mockOrganization ?? createOrganizationShell({ id: orgId });
			return {
				organization,
				orgId,
				allowShell: true,
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

	let organization = mockOrganization ?? createOrganizationShell({ id: orgId });
	let allowShell = true;
	let loadError: string | null;

	if (detailsResult.ok) {
		const mapped = mapGetOrganizationResponse(detailsResult.data, orgId);
		if (mapped) {
			organization = mapped;
			allowShell = false;
			loadError = null;
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

	return {
		organization,
		orgId,
		allowShell,
		loadError
	};
};
