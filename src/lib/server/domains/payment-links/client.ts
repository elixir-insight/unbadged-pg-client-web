import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CancelPaymentLinkResponseSchema,
	CreatePaymentLinkCreatedSchema,
	PaymentLinkCountsResponseSchema,
	PaymentLinkListResponseSchema,
	type CreatePaymentLinkUpstreamRequest
} from './schema';

const PAYMENT_LINKS_PATH = '/api/v1/merchant/organizations/payment-links';

export type PaymentLinkListQuery = {
	page?: number;
	limit?: number;
	orderId?: string;
	statuses?: string;
};

export const paymentLinksClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: PaymentLinkListQuery = {}
	) =>
		apiFetch(PAYMENT_LINKS_PATH, {
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
			schema: PaymentLinkListResponseSchema
		}),

	getCounts: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch(`${PAYMENT_LINKS_PATH}/counts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: PaymentLinkCountsResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreatePaymentLinkUpstreamRequest
	) =>
		apiFetch(PAYMENT_LINKS_PATH, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreatePaymentLinkCreatedSchema
		}),

	cancel: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orderId: string
	) =>
		apiFetch(`${PAYMENT_LINKS_PATH}/${encodeURIComponent(orderId)}/cancel`, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			schema: CancelPaymentLinkResponseSchema
		})
};
