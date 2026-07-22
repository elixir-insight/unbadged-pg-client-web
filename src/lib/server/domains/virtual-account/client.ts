import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateVirtualAccountResponseSchema,
	MerchantVirtualAccountsResponseSchema,
	type CreateVirtualAccountRequest
} from './schema';

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
		}),

	/** GET /api/v1/management/organizations/{orgId}/virtual-accounts */
	listByOrganization: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		query: VirtualAccountsQuery = {}
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/virtual-accounts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				pipelineCode: query.pipelineCode
			},
			schema: MerchantVirtualAccountsResponseSchema
		}),

	/** POST /api/v1/management/organizations/{orgId}/virtual-accounts */
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: CreateVirtualAccountRequest
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/virtual-accounts`, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateVirtualAccountResponseSchema
		})
};
