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

	const result = await organizationClient.get(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	if (result.ok) {
		const organization = mapGetOrganizationResponse(result.data, orgId);

		if (organization) {
			return {
				organization,
				orgId,
				allowShell: false,
				loadError: null
			};
		}
		log.warn({ orgId, upstream: result.data }, 'GET organization returned unmapped payload');
		return {
			organization: mockOrganization,
			orgId,
			allowShell: true,
			loadError: 'Unexpected organization response shape'
		};
	}

	const status = result.error.kind === 'http' ? result.error.status : undefined;
	const exceptionCode = result.error.kind === 'http' ? result.error.code : undefined;

	log.warn(
		{
			orgId,
			kind: result.error.kind,
			status,
			exceptionCode,
			message: result.error.message
		},
		'GET organization failed'
	);

	return {
		organization: mockOrganization,
		orgId,
		allowShell: true,
		loadError: result.error.message
	};
};
