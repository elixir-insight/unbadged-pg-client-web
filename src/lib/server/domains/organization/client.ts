import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	AddOrganizationBankResponseSchema,
	CreateOrganizationResponseSchema,
	GetDirectorDocumentsResponseSchema,
	GetOrganizationBankAccountsResponseSchema,
	GetOrganizationDetailsResponseSchema,
	GetOrganizationDocumentsResponseSchema,
	GetOrganizationResponseSchema,
	UploadOrganizationDocumentsResponseSchema,
	UpdateOrganizationResponseSchema,
	UpdateOrganizationStatusResponseSchema,
	type AddOrganizationBankRequest,
	type CreateOrganizationRequest,
	type UpdateOrganizationKybRequest,
	type UpdateOrganizationStatusRequest
} from './schema';

export const organizationClient = {
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

	get: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string
	) =>
		apiFetch(`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: GetOrganizationResponseSchema
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
		})
};
