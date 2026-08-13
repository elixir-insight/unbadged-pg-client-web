import type { Logger } from 'pino';
import { mapChargeConfigurationRecords } from '$lib/charge-configuration/map-to-slabs';
import type { ChargeConfigurationItem } from '$lib/charge-configuration/types';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { commissionConfigurationClient } from '../client';

export type CommissionConfigurationsLoadResult = {
	commissionConfigurations: ChargeConfigurationItem[];
	commissionConfigurationsError: string | null;
};

export async function loadCommissionConfigurations(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	vaNumber: string;
}): Promise<CommissionConfigurationsLoadResult> {
	const orgId = params.orgId.trim();
	const vaNumber = params.vaNumber.trim();

	if (!orgId) {
		return {
			commissionConfigurations: [],
			commissionConfigurationsError: 'Organization id is required'
		};
	}

	if (!vaNumber) {
		return {
			commissionConfigurations: [],
			commissionConfigurationsError: 'Virtual account number is required'
		};
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return {
			commissionConfigurations: [],
			commissionConfigurationsError: session.message
		};
	}

	const result = await commissionConfigurationClient.listByOrganization(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		vaNumber
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, vaNumber, message: result.error.message },
			'GET commission configurations failed'
		);
		return {
			commissionConfigurations: [],
			commissionConfigurationsError: result.error.message
		};
	}

	return {
		commissionConfigurations: mapChargeConfigurationRecords(result.data.data),
		commissionConfigurationsError: null
	};
}
