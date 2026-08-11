import type { Organization } from '$lib/data/mockData';
import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import { findOrganizationTableName } from '$lib/server/domains/organization/mappers/from-api/organizations-table';
import {
	applyPendingOrganizationName,
	hasPersistedOrganizationName
} from '$lib/organization/apply-pending-name';

export async function resolveOrganizationDisplayName(params: {
	organization: Organization;
	orgId: string;
	fetch: typeof fetch;
	log: Logger;
	accessToken: string;
	gatewayToken: string;
}): Promise<Organization> {
	if (hasPersistedOrganizationName(params.organization, params.orgId)) {
		return params.organization;
	}

	let organization = params.organization;

	const profileResult = await organizationClient.getProfile(
		params.fetch,
		params.log,
		params.accessToken,
		params.gatewayToken,
		params.orgId
	);

	if (profileResult.ok) {
		const profile = profileResult.data.data[0];
		const profileName = profile?.companyName?.trim() || profile?.orgName?.trim() || '';
		if (profileName && profileName !== params.orgId) {
			organization = applyPendingOrganizationName(organization, profileName, params.orgId);
		}
	}

	if (hasPersistedOrganizationName(organization, params.orgId)) {
		return organization;
	}

	const tableResult = await organizationClient.listTable(
		params.fetch,
		params.log,
		params.accessToken,
		params.gatewayToken,
		{
			search: params.orgId,
			limit: 10,
			page: 1
		}
	);

	if (tableResult.ok) {
		const tableName = findOrganizationTableName(tableResult.data.data, params.orgId);
		if (tableName) {
			organization = applyPendingOrganizationName(organization, tableName, params.orgId);
		}
	}

	return organization;
}
