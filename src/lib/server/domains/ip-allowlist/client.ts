import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { IpAllowlistResponseSchema } from './schema';

export const ipAllowlistClient = {
	list: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/management/organizations/ip-allowlists', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: IpAllowlistResponseSchema
		})
};
