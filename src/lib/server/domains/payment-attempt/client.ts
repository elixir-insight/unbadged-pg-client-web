import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	PaymentAttemptCountsResponseSchema,
	PaymentAttemptListResponseSchema,
	PaymentRefundListResponseSchema
} from './schema';

export interface PaymentAttemptListQuery {
	orderId?: string;
	payinAttemptId?: string;
	settlementId?: string;
	paymentMethods?: string;
	statuses?: string;
	fromDate?: string;
	toDate?: string;
	limit?: number;
	page?: number;
	virtualAccountNumber?: string;
}

export type PaymentAttemptPortal = 'merchant' | 'management';

export const paymentAttemptClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: PaymentAttemptListQuery = {},
		portal: PaymentAttemptPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/payment/attempts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				orderId: query.orderId,
				payinAttemptId: query.payinAttemptId,
				settlementId: query.settlementId,
				paymentMethods: query.paymentMethods,
				statuses: query.statuses,
				fromDate: query.fromDate,
				toDate: query.toDate,
				limit: query.limit,
				page: query.page,
				VAN: query.virtualAccountNumber
			},
			schema: PaymentAttemptListResponseSchema
		}),

	getCounts: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		virtualAccountNumber?: string,
		portal: PaymentAttemptPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/payment/attempts/counts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { VAN: virtualAccountNumber },
			schema: PaymentAttemptCountsResponseSchema
		}),

	listRefunds: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		payinAttemptId: string,
		portal: PaymentAttemptPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/payment/attempts/${encodeURIComponent(payinAttemptId)}/refunds`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: PaymentRefundListResponseSchema
		})
};
