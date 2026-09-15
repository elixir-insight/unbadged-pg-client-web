import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	ChargebackOverviewResponseSchema,
	CreateDisputeChargebackRequestSchema,
	CreateDisputeChargebackResponseSchema,
	CreateDisputeRequestSchema,
	CreateDisputeResponseSchema,
	DeleteDisputeDocumentResponseSchema,
	DisputeEventsResponseSchema,
	DisputeListResponseSchema,
	DisputeStatusesResponseSchema,
	GetDisputeDocumentDownloadUrlResponseSchema,
	GetDisputeDocumentsResponseSchema,
	ListDisputeChargebacksResponseSchema,
	UpdateDisputeDocumentRequestSchema,
	UpdateDisputeDocumentResponseSchema,
	UpdateDisputeRequestSchema,
	UpdateDisputeResponseSchema,
	UpdateDisputeStatusRequestSchema,
	UpdateDisputeStatusResponseSchema,
	UploadDisputeDocumentsResponseSchema,
	type CreateDisputeChargebackRequest,
	type CreateDisputeRequest,
	type UpdateDisputeDocumentRequest,
	type UpdateDisputeRequest,
	type UpdateDisputeStatusRequest
} from './schema';

export type DisputeListQuery = {
	status?: string;
	source?: string;
	orderId?: string;
	pipelineTransactionId?: string;
	limit?: number;
	page?: number;
};

export type DisputePortal = 'merchant' | 'management';

export const disputeClient = {
	/** GET /api/v1/{portal}/organizations/{orgId}/disputes */
	listByOrganization: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		query: DisputeListQuery = {},
		portal: DisputePortal = 'management'
	) =>
		apiFetch(`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				status: query.status,
				source: query.source,
				orderId: query.orderId,
				pipelineTransactionId: query.pipelineTransactionId,
				limit: query.limit,
				page: query.page
			},
			schema: DisputeListResponseSchema
		}),

	/** GET /api/v1/{portal}/organizations/{orgId}/disputes/{disputeId} */
	getById: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		portal: DisputePortal = 'management'
	) =>
		apiFetch(
			`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: DisputeListResponseSchema
			}
		),

	/** GET /api/v1/{portal}/organizations/{orgId}/disputes/{disputeId}/events */
	listEvents: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		portal: DisputePortal = 'management'
	) =>
		apiFetch(
			`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/events`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: DisputeEventsResponseSchema
			}
		),

	/** GET /api/v1/management/disputes/chargebacks/overview */
	listChargebackOverview: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: { limit?: number; page?: number } = {}
	) =>
		apiFetch('api/v1/management/disputes/chargebacks/overview', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				limit: query.limit,
				page: query.page
			},
			schema: ChargebackOverviewResponseSchema
		}),

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

	/** PATCH /api/v1/management/organizations/{orgId}/disputes/{disputeId} */
	update: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		body: UpdateDisputeRequest
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'PATCH',
				accessToken,
				gatewayToken,
				body,
				schema: UpdateDisputeResponseSchema
			}
		),

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

	/** GET /api/v1/{portal}/organizations/{orgId}/disputes/{disputeId}/documents */
	listDocuments: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		portal: DisputePortal = 'management'
	) =>
		apiFetch(
			`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/documents`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: GetDisputeDocumentsResponseSchema
			}
		),

	/** PUT /api/v1/{portal}/organizations/{orgId}/disputes/{disputeId}/documents */
	uploadDocuments: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		body: FormData,
		portal: DisputePortal = 'management'
	) =>
		apiFetch(
			`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/documents`,
			{
				fetch: fetchFn,
				logger,
				method: 'PUT',
				accessToken,
				gatewayToken,
				body,
				schema: UploadDisputeDocumentsResponseSchema
			}
		),

	/** PATCH /api/v1/management/organizations/{orgId}/disputes/{disputeId}/documents/{documentId}/visibility */
	updateDocument: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		documentId: string,
		body: UpdateDisputeDocumentRequest
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/documents/${encodeURIComponent(documentId)}/visibility`,
			{
				fetch: fetchFn,
				logger,
				method: 'PATCH',
				accessToken,
				gatewayToken,
				body,
				schema: UpdateDisputeDocumentResponseSchema
			}
		),

	/** DELETE /api/v1/{portal}/organizations/{orgId}/disputes/{disputeId}/documents/{documentId} */
	deleteDocument: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		documentId: string,
		portal: DisputePortal = 'management'
	) =>
		apiFetch(
			`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/documents/${encodeURIComponent(documentId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'DELETE',
				accessToken,
				gatewayToken,
				schema: DeleteDisputeDocumentResponseSchema
			}
		),

	/** GET /api/v1/{portal}/organizations/{orgId}/disputes/{disputeId}/documents/{documentId}/download-url */
	getDocumentDownloadUrl: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		documentId: string,
		disposition: 'inline' | 'attachment' = 'inline',
		portal: DisputePortal = 'management'
	) =>
		apiFetch(
			`api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/documents/${encodeURIComponent(documentId)}/download-url`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				query: { disposition },
				schema: GetDisputeDocumentDownloadUrlResponseSchema
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
		}),

	/** GET /api/v1/management/organizations/{orgId}/disputes/chargebacks */
	listChargebacksByOrganization: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		query: { limit?: number; page?: number; disputeId?: string } = {}
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/chargebacks`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				limit: query.limit,
				page: query.page,
				disputeId: query.disputeId
			},
			schema: ListDisputeChargebacksResponseSchema
		}),

	/** POST /api/v1/management/organizations/{orgId}/disputes/{disputeId}/chargebacks */
	createChargeback: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		disputeId: string,
		body: CreateDisputeChargebackRequest
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/disputes/${encodeURIComponent(disputeId)}/chargebacks`,
			{
				fetch: fetchFn,
				logger,
				method: 'POST',
				accessToken,
				gatewayToken,
				body,
				schema: CreateDisputeChargebackResponseSchema
			}
		)
};

export {
	CreateDisputeChargebackRequestSchema,
	CreateDisputeRequestSchema,
	UpdateDisputeDocumentRequestSchema,
	UpdateDisputeRequestSchema,
	UpdateDisputeStatusRequestSchema
};
