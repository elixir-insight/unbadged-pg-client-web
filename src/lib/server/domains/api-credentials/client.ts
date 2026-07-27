import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	ApiCredentialListResponseSchema,
	ApiCredentialCreateResponseSchema,
	ApiCredentialRevokeResponseSchema
} from './schema';

export const apiCredentialsClient = {
	list: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/management/organizations/api-credentials', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			schema: ApiCredentialListResponseSchema
		}),

	create: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/management/organizations/api-credentials', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			schema: ApiCredentialCreateResponseSchema
		}),

	revoke: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		id: string
	) =>
		apiFetch(`/api/v1/management/organizations/api-credentials/${encodeURIComponent(id)}`, {
			fetch: fetchFn,
			logger,
			method: 'DELETE',
			accessToken,
			gatewayToken,
			schema: ApiCredentialRevokeResponseSchema
		})
};
