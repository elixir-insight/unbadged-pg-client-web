import type { PageServerLoad } from './$types';
import {
	loadOrganizationBankAccounts,
	resolveOrganizationBase
} from '$lib/server/domains/organization/load-bank-accounts';

export const load: PageServerLoad = async ({ params, parent, cookies, fetch, locals, depends }) => {
	depends('org-bank-accounts');

	const parentData = await parent();
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const organizationBase = orgId ? resolveOrganizationBase(parentData, orgId) : null;

	if (!orgId || !organizationBase) {
		return {
			bankAccountsLoadError: 'Organization id is required',
			bankAccounts: organizationBase?.bankAccounts ?? []
		};
	}

	return loadOrganizationBankAccounts({
		fetch,
		log,
		cookies,
		orgId,
		organizationBase
	});
};
