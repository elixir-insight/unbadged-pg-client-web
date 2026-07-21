import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	SettlementDetailsResponseSchema,
	SettlementListResponseSchema,
	SettlementOverviewResponseSchema,
	type SettlementApiStatus
} from './schema';

export type SettlementPortal = 'merchant' | 'management';

export type SettlementListQuery = {
	page?: number;
	limit?: number;
	status?: SettlementApiStatus;
	fromDate?: string;
	toDate?: string;
	search?: string;
	/** Management only — encoded org id (e.g. ORG-1000). */
	orgId?: string;
};

export type SettlementDetailsQuery = {
	page?: number;
	limit?: number;
};

export const settlementClient = {
	getOverview: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('api/v1/merchant/settlements/overview', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: SettlementOverviewResponseSchema
		}),

	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: SettlementListQuery = {},
		portal: SettlementPortal = 'merchant'
	) =>
		apiFetch(`api/v1/${portal}/settlements`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				page: query.page,
				limit: query.limit,
				status: query.status,
				fromDate: query.fromDate,
				toDate: query.toDate,
				search: query.search,
				orgId: portal === 'management' ? query.orgId : undefined
			},
			schema: SettlementListResponseSchema
		}),

	getDetails: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		settlementId: string,
		query: SettlementDetailsQuery = {}
	) =>
		apiFetch(`api/v1/management/settlements/${encodeURIComponent(settlementId)}/details`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				page: query.page,
				limit: query.limit
			},
			schema: SettlementDetailsResponseSchema
		})
};
