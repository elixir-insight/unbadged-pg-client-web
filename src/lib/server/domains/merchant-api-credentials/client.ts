import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	MerchantApiCredentialListResponseSchema,
	MerchantApiCredentialCreateResponseSchema,
	MerchantApiCredentialRevokeResponseSchema
} from './schema';

export const merchantApiCredentialsClient = {
	list: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/merchant/organizations/api-credentials', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			schema: MerchantApiCredentialListResponseSchema
		}),

	create: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/merchant/organizations/api-credentials', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			schema: MerchantApiCredentialCreateResponseSchema
		}),

	revoke: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		id: string
	) =>
		apiFetch(`/api/v1/merchant/organizations/api-credentials/${encodeURIComponent(id)}`, {
			fetch: fetchFn,
			logger,
			method: 'DELETE',
			accessToken,
			gatewayToken,
			schema: MerchantApiCredentialRevokeResponseSchema
		})
};
