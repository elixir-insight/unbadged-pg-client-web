import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { GetReferralMerchantsResponseSchema } from './schema';

export type ListReferralMerchantsQuery = {
	companyName?: string;
	page?: number;
	limit?: number;
	statuses?: string;
	businessType?: string;
};

export const partnerReferralsClient = {
	listReferralMerchants: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: ListReferralMerchantsQuery = {}
	) =>
		apiFetch('api/v1/partner/referral-merchants', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				companyName: query.companyName,
				page: query.page,
				limit: query.limit,
				statuses: query.statuses,
				businessType: query.businessType
			},
			schema: GetReferralMerchantsResponseSchema
		})
};
