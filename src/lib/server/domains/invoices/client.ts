import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { CreateInvoiceCreatedSchema, type CreateInvoiceUpstreamRequest } from './schema';

const INVOICES_PATH = '/api/v1/merchant/payment/invoice';

export const invoicesClient = {
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateInvoiceUpstreamRequest
	) =>
		apiFetch(INVOICES_PATH, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateInvoiceCreatedSchema
		})
};
