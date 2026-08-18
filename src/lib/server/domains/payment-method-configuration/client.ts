import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { ListPaymentMethodConfigurationsResponseSchema } from './schema';

export const paymentMethodConfigurationClient = {
	/** GET /api/v1/management/payment-method-configurations/{pipelineCode} */
	listByPipeline: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		pipelineCode: string
	) =>
		apiFetch(
			`api/v1/management/payment-method-configurations/${encodeURIComponent(pipelineCode)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: ListPaymentMethodConfigurationsResponseSchema
			}
		)
};
