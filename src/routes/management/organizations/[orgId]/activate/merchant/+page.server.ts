import type { PageServerLoad } from './$types';
import { loadOrganizationFeeConfigurationPage } from '$lib/server/domains/organization/loaders/fee-configuration-page';

export const load: PageServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('org-payin-van');
	depends('org-payin-pipelines');
	depends('org-payment-method-configurations');
	depends('org-charge-configurations');
	depends('org-commission-configurations');

	const orgId = params.orgId?.trim() ?? '';
	const log = locals.logger.child({ action: 'activate-merchant' });

	return loadOrganizationFeeConfigurationPage({
		fetch,
		log,
		cookies,
		orgId
	});
};
