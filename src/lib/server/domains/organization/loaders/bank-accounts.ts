import { organizations, type Organization, type OrganizationBankAccount } from '$lib/data/mockData';
import { isUiOnlyOnboardingCategory } from '$lib/organization/category';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '../client';
import { mapBankAccounts } from '../mappers/from-api/get-organization';
import type { Logger } from 'pino';

export async function loadOrganizationBankAccounts(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof getValidSession>[0];
	orgId: string;
	organizationBase: Organization;
}): Promise<{
	bankAccountsLoadError: string | null;
	bankAccounts: OrganizationBankAccount[];
}> {
	const { fetch, log, cookies, orgId, organizationBase } = params;

	if (isUiOnlyOnboardingCategory(organizationBase.category)) {
		const mockOrganization =
			organizations.find((candidate) => candidate.id === orgId) ?? organizationBase;
		return {
			bankAccountsLoadError: null,
			bankAccounts: mockOrganization.bankAccounts
		};
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				bankAccountsLoadError: e.message,
				bankAccounts: organizationBase.bankAccounts
			};
		}
		throw e;
	}

	const result = await organizationClient.getBankAccounts(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	if (!result.ok) {
		log.warn(
			{
				orgId,
				kind: result.error.kind,
				message: result.error.message
			},
			'GET organization bank accounts failed'
		);

		return {
			bankAccountsLoadError: result.error.message,
			bankAccounts: organizationBase.bankAccounts
		};
	}

	return {
		bankAccountsLoadError: null,
		bankAccounts: mapBankAccounts(result.data.data ?? [])
	};
}
