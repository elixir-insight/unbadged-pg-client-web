import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { MerchantVirtualAccountsResponseSchema } from './schema';

export interface VirtualAccountsQuery {
	pipelineCode?: string;
}

export const virtualAccountClient = {
	/** GET /api/v1/merchant/virtual-accounts */
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: VirtualAccountsQuery = {}
	) =>
		apiFetch('api/v1/merchant/virtual-accounts', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				pipelineCode: query.pipelineCode
			},
			schema: MerchantVirtualAccountsResponseSchema
		})
};
