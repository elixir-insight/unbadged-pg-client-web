import type { LayoutServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { disputeClient } from '$lib/server/domains/dispute/client';
import { mapDisputeStatuses } from '$lib/server/domains/dispute/mappers/from-api/statuses';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapDashboardMerchantsToOptions } from '$lib/server/domains/organization/mappers/from-api/dashboard-merchants';
import type { DisputeStatusOption } from '$lib/utils/dispute-status';

export interface DisputeMerchantOption {
	value: string;
	label: string;
}

export const load: LayoutServerLoad = async ({ cookies, fetch, locals, depends }) => {
	depends('management-disputes:merchants');
	depends('management-disputes:statuses');

	const log = locals.logger.child({ action: 'management-disputes-layout' });
	const empty = {
		merchantOptions: [] as DisputeMerchantOption[],
		merchantsError: null as string | null,
		statusOptions: [] as DisputeStatusOption[],
		statusesError: null as string | null
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return { ...empty, merchantsError: error.message, statusesError: error.message };
		}
		throw error;
	}

	const [merchantsResult, statusesResult] = await Promise.all([
		organizationClient.listDashboardMerchants(fetch, log, tokens.accessToken, tokens.gatewayToken),
		disputeClient.listStatuses(fetch, log, tokens.accessToken, tokens.gatewayToken)
	]);

	if (!merchantsResult.ok) {
		log.warn(
			{ kind: merchantsResult.error.kind, message: merchantsResult.error.message },
			'GET management dashboard merchants failed'
		);
		empty.merchantsError = merchantsResult.error.message;
	} else {
		empty.merchantOptions = mapDashboardMerchantsToOptions(merchantsResult.data.data).map(
			(merchant) => ({
				value: merchant.orgId,
				label: merchant.merchantName
			})
		);
	}

	if (!statusesResult.ok) {
		log.warn(
			{ kind: statusesResult.error.kind, message: statusesResult.error.message },
			'GET dispute statuses failed'
		);
		empty.statusesError = statusesResult.error.message;
	} else {
		empty.statusOptions = mapDisputeStatuses(statusesResult.data.data);
	}

	return empty;
};
