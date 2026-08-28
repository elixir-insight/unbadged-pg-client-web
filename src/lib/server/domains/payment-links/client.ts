import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { CreatePaymentLinkCreatedSchema, type CreatePaymentLinkUpstreamRequest } from './schema';

function createPath(orgId: string): string {
	return `/api/v1/merchant/organizations/${encodeURIComponent(orgId)}/payment-links`;
}

export const paymentLinksClient = {
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: CreatePaymentLinkUpstreamRequest
	) =>
		apiFetch(createPath(orgId), {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreatePaymentLinkCreatedSchema
		})
};
