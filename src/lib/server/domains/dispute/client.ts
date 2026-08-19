import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateDisputeRequestSchema,
	CreateDisputeResponseSchema,
	DisputeEventsResponseSchema,
	DisputeListResponseSchema,
	DisputeStatusesResponseSchema,
	UpdateDisputeStatusRequestSchema,
	UpdateDisputeStatusResponseSchema,
	type CreateDisputeRequest,
	type UpdateDisputeStatusRequest
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

	/** GET /api/v1/management/organizations/{orgId}/disputes/{disputeId} */
	getById: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: DisputeListResponseSchema
			}
		),

	/** GET /api/v1/management/organizations/{orgId}/disputes/{disputeId}/events */
	listEvents: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/events`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: DisputeEventsResponseSchema
			}
		),

	/** GET /api/v1/management/disputes/statuses */
	listStatuses: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string
	) =>
		apiFetch('api/v1/management/disputes/statuses', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: DisputeStatusesResponseSchema
		}),

	/** POST /api/v1/management/organizations/{orgId}/disputes/{disputeId}/events */
	createEvent: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		body: UpdateDisputeStatusRequest
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/events`,
			{
				fetch: fetchFn,
				logger,
				method: 'POST',
				accessToken,
				gatewayToken,
				body,
				schema: UpdateDisputeStatusResponseSchema
			}
		),

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

export { CreateDisputeRequestSchema, UpdateDisputeStatusRequestSchema };
