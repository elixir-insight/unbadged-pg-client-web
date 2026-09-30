import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateInvoiceCreatedSchema,
	InvoiceCountsResponseSchema,
	InvoiceListResponseSchema,
	type CreateInvoiceUpstreamRequest
} from './schema';

const INVOICE_CREATE_PATH = '/api/v1/merchant/payment/invoice';
const INVOICES_PATH = '/api/v1/merchant/payment/invoices';

export type InvoiceListQuery = {
	page?: number;
	limit?: number;
	orderId?: string;
	statuses?: string;
};

export const invoicesClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: InvoiceListQuery = {}
	) =>
		apiFetch(INVOICES_PATH, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				page: query.page,
				limit: query.limit,
				orderId: query.orderId,
				statuses: query.statuses
			},
			schema: InvoiceListResponseSchema
		}),

	getCounts: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch(`${INVOICES_PATH}/counts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: InvoiceCountsResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateInvoiceUpstreamRequest
	) =>
		apiFetch(INVOICE_CREATE_PATH, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateInvoiceCreatedSchema
		})
};
