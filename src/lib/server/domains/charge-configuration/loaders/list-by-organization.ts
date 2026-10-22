import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { mapChargeConfigurationRecords } from '$lib/charge-configuration/map-to-slabs';
import type { ChargeConfigurationItem } from '$lib/charge-configuration/types';
import { chargeConfigurationClient } from '../client';

export type ChargeConfigurationsLoadResult = {
	chargeConfigurations: ChargeConfigurationItem[];
	chargeConfigurationsError: string | null;
};

export async function loadChargeConfigurations(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	vaNumber: string;
}): Promise<ChargeConfigurationsLoadResult> {
	const orgId = params.orgId.trim();
	const vaNumber = params.vaNumber.trim();

	if (!orgId) {
		return {
			chargeConfigurations: [],
			chargeConfigurationsError: 'Organization id is required'
		};
	}

	if (!vaNumber) {
		return {
			chargeConfigurations: [],
			chargeConfigurationsError: 'Virtual account number is required'
		};
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return {
			chargeConfigurations: [],
			chargeConfigurationsError: session.message
		};
	}

	const result = await chargeConfigurationClient.listByOrganization(
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
			'GET charge configurations failed'
		);
		return {
			chargeConfigurations: [],
			chargeConfigurationsError: result.error.message
		};
	}

	return {
		chargeConfigurations: mapChargeConfigurationRecords(result.data.data),
		chargeConfigurationsError: null
	};
}
