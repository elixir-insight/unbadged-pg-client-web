import type { LayoutServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapDashboardMerchantsToOptions } from '$lib/server/domains/organization/mappers/from-api/dashboard-merchants';

export interface DisputeMerchantOption {
	value: string;
	label: string;
}

export const load: LayoutServerLoad = async ({ cookies, fetch, locals, depends }) => {
	depends('management-disputes:merchants');

	const log = locals.logger.child({ action: 'management-disputes-merchants' });
	const empty = {
		merchantOptions: [] as DisputeMerchantOption[],
		merchantsError: null as string | null
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return { ...empty, merchantsError: error.message };
		}
		throw error;
	}

	const result = await organizationClient.listDashboardMerchants(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken
	);

	if (!result.ok) {
		log.warn(
			{ kind: result.error.kind, message: result.error.message },
			'GET management dashboard merchants failed'
		);
		return { ...empty, merchantsError: result.error.message };
	}

	return {
		merchantOptions: mapDashboardMerchantsToOptions(result.data.data).map((merchant) => ({
			value: merchant.orgId,
			label: merchant.merchantName
		})),
		merchantsError: null
	};
};
