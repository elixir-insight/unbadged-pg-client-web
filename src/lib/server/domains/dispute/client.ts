import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateDisputeRequestSchema,
	CreateDisputeResponseSchema,
	DisputeListResponseSchema,
	type CreateDisputeRequest
} from './schema';

export type DisputeListQuery = {
	status?: string;
	source?: string;
	limit?: number;
	page?: number;
};

export const disputeClient = {
	/** GET /api/v1/management/organizations/{orgId}/disputes */
	listByOrganization: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		query: DisputeListQuery = {}
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				status: query.status,
				source: query.source,
				limit: query.limit,
				page: query.page
			},
			schema: DisputeListResponseSchema
		}),

	/** POST /api/v1/management/organizations/{orgId}/disputes */
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: CreateDisputeRequest
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes`, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateDisputeResponseSchema
		})
};

export { CreateDisputeRequestSchema };
