import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import type { DashboardKpiRange, DashboardTrendGranularity } from '../dashboard/schema';
import {
	CommissionChartResponseSchema,
	CommissionTrendResponseSchema,
	PartnerKpisResponseSchema
} from './schema';

export const partnerDashboardClient = {
	getKpis: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d'
	) =>
		apiFetch('api/v1/partner/dashboard/kpis', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range },
			schema: PartnerKpisResponseSchema
		}),

	getCommissionTrend: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d',
		granularity: DashboardTrendGranularity = 'daily'
	) =>
		apiFetch('api/v1/partner/dashboard/commission/trend', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range, granularity },
			schema: CommissionTrendResponseSchema
		}),

	getCommissionChart: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		range: DashboardKpiRange = '7d'
	) =>
		apiFetch('api/v1/partner/dashboard/commission/chart', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { range },
			schema: CommissionChartResponseSchema
		})
};
