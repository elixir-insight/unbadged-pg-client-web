import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	PaymentOrderCountsResponseSchema,
	PaymentOrderListResponseSchema,
	PaymentOrderTimelineResponseSchema
} from './schema';

export interface PaymentOrderListQuery {
	orderId?: string;
	statuses?: string;
	fromDate?: string;
	toDate?: string;
	limit?: number;
	page?: number;
	virtualAccountNumber?: string;
}

export type PaymentOrderPortal = 'merchant' | 'management';

export const paymentOrderClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: PaymentOrderListQuery = {},
		portal: PaymentOrderPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/payment/orders`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				orderId: query.orderId,
				statuses: query.statuses,
				fromDate: query.fromDate,
				toDate: query.toDate,
				limit: query.limit,
				page: query.page,
				VAN: query.virtualAccountNumber
			},
			schema: PaymentOrderListResponseSchema
		}),

	getCounts: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		virtualAccountNumber?: string,
		portal: PaymentOrderPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/payment/orders/counts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { VAN: virtualAccountNumber },
			schema: PaymentOrderCountsResponseSchema
		}),

	getTimeline: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orderId: string,
		portal: PaymentOrderPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/payment/orders/${encodeURIComponent(orderId)}/timeline`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: PaymentOrderTimelineResponseSchema
		})
};
