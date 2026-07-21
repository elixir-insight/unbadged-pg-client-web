import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	IpAllowlistResponseSchema,
	CreateIpAllowlistResponseSchema,
	DeleteIpAllowlistResponseSchema,
	type CreateIpAllowlistRequest
} from './schema';

export const ipAllowlistClient = {
	list: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/management/organizations/ip-allowlists/', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: IpAllowlistResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateIpAllowlistRequest
	) =>
		apiFetch('/api/v1/management/organizations/ip-allowlists/', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateIpAllowlistResponseSchema
		}),

	remove: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		id: number
	) =>
		apiFetch(`/api/v1/management/organizations/ip-allowlists/${id}`, {
			fetch: fetchFn,
			logger,
			method: 'DELETE',
			accessToken,
			gatewayToken,
			schema: DeleteIpAllowlistResponseSchema
		})
};
