import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { organizations } from '$lib/data/mockData';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapGetOrganizationResponse } from '$lib/server/domains/organization/mappers/from-api/get-organization';

export const load: LayoutServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('org');

	const log = locals.logger;
	const orgId = params.orgId?.trim();

	if (!orgId) {
		error(404, 'Organization not found');
	}

	const mockOrganization = organizations.find((candidate) => candidate.id === orgId) ?? null;

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				organization: mockOrganization,
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

	if (detailsResult.ok) {
		const organization = mapGetOrganizationResponse(detailsResult.data, orgId);
		if (organization) {
			return {
				organization,
				orgId,
				allowShell: false,
				loadError: null
			};
		}
		log.warn(
			{ orgId, upstream: detailsResult.data },
			'GET organization details returned unmapped payload'
		);
		return {
			organization: mockOrganization,
			orgId,
			allowShell: true,
			loadError: 'Unexpected organization details response shape'
		};
	}

	const status = detailsResult.error.kind === 'http' ? detailsResult.error.status : undefined;
	const exceptionCode = detailsResult.error.kind === 'http' ? detailsResult.error.code : undefined;

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

	return {
		organization: mockOrganization,
		orgId,
		allowShell: true,
		loadError: detailsResult.error.message
	};
};
