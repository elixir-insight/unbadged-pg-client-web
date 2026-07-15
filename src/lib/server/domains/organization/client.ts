import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { CreateOrganizationResponseSchema, type CreateOrganizationRequest } from './schema';

export const organizationClient = {
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateOrganizationRequest
	) =>
		apiFetch('api/v1/management/onboard/organization', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateOrganizationResponseSchema
		})
};
