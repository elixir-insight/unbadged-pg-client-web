import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { organizationClient } from '$lib/server/domains/organization/client';
import type { OrganizationTableStatusCounts } from '$lib/organization/table';
import { mapOrganizationsTableResponse } from '$lib/server/domains/organization/mappers/from-api/organizations-table';

const DEFAULT_LIMIT = 8;

function emptyStatusCounts(): OrganizationTableStatusCounts {
	return {
		all: 0,
		IN_PROGRESS: 0,
		IN_REVIEW: 0,
		APPROVED: 0,
		ACTIVE: 0,
		ON_HOLD: 0,
		FROZEN: 0,
		REJECTED: 0
	};
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('organizations:table');
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'read');

	const log = locals.logger;
	const skip = Number(url.searchParams.get('skip')) || 0;
	const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const search = url.searchParams.get('search')?.trim() ?? '';
	const status = url.searchParams.get('status')?.trim() ?? '';
	const category = url.searchParams.get('category')?.trim() ?? '';
	const page = Math.floor(skip / limit) + 1;

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				organizations: [],
				pagination: { limit, page: 1, total: 0 },
				statusCounts: emptyStatusCounts(),
				tableError: e.message
			};
		}
		throw e;
	}

	const result = await organizationClient.listTable(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		{
			search: search || undefined,
			status: status || undefined,
			category: category || undefined,
			page,
			limit
		}
	);

	if (!result.ok) {
		log.warn(
			{
				kind: result.error.kind,
				message: result.error.message
			},
			'GET organizations table failed'
		);

		return {
			organizations: [],
			pagination: { limit, page, total: 0 },
			statusCounts: emptyStatusCounts(),
			tableError: result.error.message
		};
	}

	const mapped = mapOrganizationsTableResponse(result.data);
	console.log(mapped, 'mapped');

	return {
		organizations: mapped.organizations,
		pagination: mapped.pagination,
		statusCounts: mapped.statusCounts,
		tableError: null
	};
};
