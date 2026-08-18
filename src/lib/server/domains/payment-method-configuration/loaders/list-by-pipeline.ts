import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { paymentMethodConfigurationClient } from '../client';
import { mapPaymentMethodConfigurations } from '$lib/payment-method-configuration/payment-path-options';
import type { PaymentMethodConfigItem } from '$lib/payment-method-configuration/types';

export type PaymentMethodConfigurationsLoadResult = {
	methodConfigurations: PaymentMethodConfigItem[];
	methodConfigurationsError: string | null;
};

export async function loadPaymentMethodConfigurations(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	pipelineCode: string;
}): Promise<PaymentMethodConfigurationsLoadResult> {
	const pipelineCode = params.pipelineCode.trim();
	if (!pipelineCode) {
		return {
			methodConfigurations: [],
			methodConfigurationsError: 'Pipeline code is required'
		};
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return {
			methodConfigurations: [],
			methodConfigurationsError: session.message
		};
	}

	const result = await paymentMethodConfigurationClient.listByPipeline(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		pipelineCode
	);

	if (!result.ok) {
		params.log.warn(
			{ pipelineCode, message: result.error.message },
			'GET payment method configurations failed'
		);
		return {
			methodConfigurations: [],
			methodConfigurationsError: result.error.message
		};
	}

	return {
		methodConfigurations: mapPaymentMethodConfigurations(result.data.data),
		methodConfigurationsError: null
	};
}
