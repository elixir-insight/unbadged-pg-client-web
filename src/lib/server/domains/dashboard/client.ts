import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CollectionsTrendResponseSchema,
	ConversionFunnelResponseSchema,
	DashboardKpisResponseSchema,
	PaymentMixResponseSchema,
	type DashboardKpiRange,
	type DashboardTrendGranularity
} from './schema';

export const dashboardClient = {
	getKpis: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d'
	) =>
		apiFetch('api/v1/merchant/dashboard/kpis', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range },
			schema: DashboardKpisResponseSchema
		}),

	getCollectionsTrend: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d',
		granularity: DashboardTrendGranularity = 'daily'
	) =>
		apiFetch('api/v1/merchant/dashboard/collections-trend', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range, granularity },
			schema: CollectionsTrendResponseSchema
		}),

	getPaymentMix: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d'
	) =>
		apiFetch('api/v1/merchant/dashboard/payment-mix', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range },
			schema: PaymentMixResponseSchema
		}),

	getConversionFunnel: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d'
	) =>
		apiFetch('api/v1/merchant/dashboard/conversion-funnel', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range },
			schema: ConversionFunnelResponseSchema
		})
};
