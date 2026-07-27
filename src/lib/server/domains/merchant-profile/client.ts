import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { MerchantProfileResponseSchema } from './schema';

export const merchantProfileClient = {
	getProfile: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/merchant/profile', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			schema: MerchantProfileResponseSchema
		})
};
