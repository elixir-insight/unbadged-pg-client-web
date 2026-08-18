import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CommissionConfigurationMutationResponseSchema,
	CreateCommissionConfigurationsRequestSchema,
	ListCommissionConfigurationsResponseSchema,
	type CreateCommissionConfigurationsRequest
} from './schema';

export const commissionConfigurationClient = {
	/** GET /api/v1/management/organizations/{orgId}/commission-configurations?vaNumber= */
	listByOrganization: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		vaNumber: string
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/commission-configurations`,
			{
				fetch: fetchFn,
				logger,
				method: 'GET',
				accessToken,
				gatewayToken,
				query: { vaNumber },
				schema: ListCommissionConfigurationsResponseSchema
			}
		),

	/** POST /api/v1/management/organizations/{orgId}/commission-configurations */
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: CreateCommissionConfigurationsRequest
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/commission-configurations`,
			{
				fetch: fetchFn,
				logger,
				method: 'POST',
				accessToken,
				gatewayToken,
				body,
				schema: CommissionConfigurationMutationResponseSchema
			}
		),

	/** DELETE /api/v1/management/organizations/{orgId}/commission-configurations/{id} */
	delete: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		commissionConfigId: string
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/commission-configurations/${encodeURIComponent(commissionConfigId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'DELETE',
				accessToken,
				gatewayToken,
				schema: CommissionConfigurationMutationResponseSchema
			}
		)
};

export { CreateCommissionConfigurationsRequestSchema };
