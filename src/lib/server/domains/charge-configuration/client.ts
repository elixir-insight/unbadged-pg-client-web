import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	ChargeConfigurationMutationResponseSchema,
	CreateChargeConfigurationsRequestSchema,
	ListChargeConfigurationsResponseSchema,
	UpdateChargeConfigurationRequestSchema,
	type CreateChargeConfigurationsRequest,
	type UpdateChargeConfigurationRequest
} from './schema';

export const chargeConfigurationClient = {
	/** GET /api/v1/management/organizations/{orgId}/charge-configurations?vaNumber= */
	listByOrganization: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		vaNumber: string
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/charge-configurations`, {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { vaNumber },
			schema: ListChargeConfigurationsResponseSchema
		}),

	/** POST /api/v1/management/organizations/{orgId}/charge-configurations */
	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		body: CreateChargeConfigurationsRequest
	) =>
		apiFetch(`api/v1/management/organizations/${encodeURIComponent(orgId)}/charge-configurations`, {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: ChargeConfigurationMutationResponseSchema
		}),

	/** DELETE /api/v1/management/organizations/{orgId}/charge-configurations/{id} */
	delete: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		chargeConfigId: string
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/charge-configurations/${encodeURIComponent(chargeConfigId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'DELETE',
				accessToken,
				gatewayToken,
				schema: ChargeConfigurationMutationResponseSchema
			}
		),

	/** PATCH /api/v1/management/organizations/{orgId}/charge-configurations/{id} */
	update: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: string,
		chargeConfigId: string,
		body: UpdateChargeConfigurationRequest
	) =>
		apiFetch(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/charge-configurations/${encodeURIComponent(chargeConfigId)}`,
			{
				fetch: fetchFn,
				logger,
				method: 'PATCH',
				accessToken,
				gatewayToken,
				body,
				schema: ChargeConfigurationMutationResponseSchema
			}
		)
};

export { CreateChargeConfigurationsRequestSchema, UpdateChargeConfigurationRequestSchema };
