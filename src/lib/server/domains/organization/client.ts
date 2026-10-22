import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	AddOrganizationBankResponseSchema,
	CreateOrganizationResponseSchema,
	DeleteDirectorResponseSchema,
	GetDirectorDocumentsResponseSchema,
	GetDashboardMerchantsResponseSchema,
	GetOrganizationBankAccountsResponseSchema,
	GetOrganizationDetailsResponseSchema,
	GetOrganizationDocumentsResponseSchema,
	GetOrganizationProfileResponseSchema,
	GetOrganizationSensitiveDataResponseSchema,
	GetOrganizationsTableResponseSchema,
	UploadOrganizationDocumentsResponseSchema,
	UpdateOrganizationProfileResponseSchema,
	UpdateOrganizationResponseSchema,
	UpdateOrganizationStatusResponseSchema,
	type AddOrganizationBankRequest,
	type CreateOrganizationRequest,
	type SensitiveDataQuery,
	type UpdateOrganizationKybRequest,
	type UpdateOrganizationProfileRequest,
	type UpdateOrganizationStatusRequest
} from './schema';

export const organizationClient = {
	listDashboardMerchants: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string
	) =>
		apiFetch('/api/v1/management/dashboard/merchants', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: GetDashboardMerchantsResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateOrganizationRequest
	) =>
		apiFetch('api/v1/management/onboard/organization', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateOrganizationResponseSchema
		}),

	getDetails: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/details`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: GetOrganizationDetailsResponseSchema
		}),

	getProfile: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/profile`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: GetOrganizationProfileResponseSchema
		}),

	getSensitiveData: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		query: SensitiveDataQuery
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/sensitive-data`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query,
			schema: GetOrganizationSensitiveDataResponseSchema
		}),

	updateProfile: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: UpdateOrganizationProfileRequest
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/profile`, {
			fetch: fetchFn,
			logger,
			method: 'PATCH',
			accessToken,
			gatewayToken,
			body,
			schema: UpdateOrganizationProfileResponseSchema
		}),

	update: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: UpdateOrganizationKybRequest
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}`, {
			fetch: fetchFn,
			logger,
			method: 'PUT',
			accessToken,
			gatewayToken,
			body,
			schema: UpdateOrganizationResponseSchema
		}),

	getBankAccounts: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/bank-accounts`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: GetOrganizationBankAccountsResponseSchema
		}),

	addBank: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: AddOrganizationBankRequest
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/bank`, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: AddOrganizationBankResponseSchema
		}),

	getDocuments: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/documents`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: GetOrganizationDocumentsResponseSchema
		}),

	uploadDocuments: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: FormData
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/documents`, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: UploadOrganizationDocumentsResponseSchema
		}),

	uploadDirectorDocuments: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		directorId: string,
		body: FormData
	) =>
		apiFetch(
			`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/directors/${encodeURIComponent(directorId)}/documents`,
			{
				fetch: fetchFn,
				logger,
				method: 'POST',
				accessToken,
				gatewayToken,
				body,
				schema: UploadOrganizationDocumentsResponseSchema
			}
		),

	getDirectorDocuments: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		directorId: string
	) =>
		apiFetch(
			`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/directors/${encodeURIComponent(directorId)}/documents`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				schema: GetDirectorDocumentsResponseSchema
			}
		),

	/** DELETE /api/v1/management/onboard/organization/{orgId}/directors/{directorId} */
	deleteDirector: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		directorId: string
	) =>
		apiFetch(
			`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/directors/${encodeURIComponent(directorId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'DELETE',
				accessToken,
				gatewayToken,
				schema: DeleteDirectorResponseSchema
			}
		),

	updateBank: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		accountId: string,
		body: AddOrganizationBankRequest
	) =>
		apiFetch(
			`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/bank/${encodeURIComponent(accountId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'PUT',
				accessToken,
				gatewayToken,
				body,
				schema: AddOrganizationBankResponseSchema
			}
		),

	updateStatus: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: UpdateOrganizationStatusRequest
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/status`, {
			fetch: fetchFn,
			logger,
			method: 'PUT',
			accessToken,
			gatewayToken,
			body,
			schema: UpdateOrganizationStatusResponseSchema
		}),

	listTable: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: {
			search?: string;
			status?: string;
			category?: string;
			page?: number;
			limit?: number;
		}
	) =>
		apiFetch('/api/v1/management/organizations/table', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: {
				search: query.search,
				status: query.status,
				category: query.category,
				page: query.page,
				limit: query.limit
			},
			schema: GetOrganizationsTableResponseSchema
		})
};
