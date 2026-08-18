import type { Logger } from 'pino';
import { loadChargeConfigurations } from '$lib/server/domains/charge-configuration/loaders/list-by-organization';
import { loadCommissionConfigurations } from '$lib/server/domains/commission-configuration/loaders/list-by-organization';
import { loadPaymentMethodConfigurations } from '$lib/server/domains/payment-method-configuration/loaders/list-by-pipeline';
import { loadPayinPipelineOptions } from '$lib/server/domains/pipeline/loaders/payin-pipelines';
import { resolveDefaultPipelineCode } from '$lib/server/domains/pipeline/resolve-default-pipeline';
import { ensurePayinVirtualAccount } from '$lib/server/domains/virtual-account/loaders/ensure-payin-van';
import { isUiOnlyMockOrganization } from '../utils/mock-platform-onboarding';

export async function loadOrganizationFeeConfigurationPage(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof ensurePayinVirtualAccount>[0]['cookies'];
	orgId: string;
}) {
	const orgId = params.orgId.trim();

	if (!orgId) {
		return {
			payinVan: null,
			vanError: 'Organization id is required',
			vanCreated: false,
			pipelineOptions: [],
			pipelinesError: 'Organization id is required',
			defaultPipelineCode: '',
			methodConfigurations: [],
			methodConfigurationsError: 'Organization id is required',
			chargeConfigurations: [],
			chargeConfigurationsError: 'Organization id is required',
			commissionConfigurations: [],
			commissionConfigurationsError: 'Organization id is required'
		};
	}

	if (isUiOnlyMockOrganization(orgId, params.cookies)) {
		return {
			payinVan: null,
			vanError: null,
			vanCreated: false,
			pipelineOptions: [],
			pipelinesError: null,
			defaultPipelineCode: '',
			methodConfigurations: [],
			methodConfigurationsError: null,
			chargeConfigurations: [],
			chargeConfigurationsError: null,
			commissionConfigurations: [],
			commissionConfigurationsError: null
		};
	}

	const [vanResult, pipelinesResult] = await Promise.all([
		ensurePayinVirtualAccount({
			fetch: params.fetch,
			log: params.log,
			cookies: params.cookies,
			orgId
		}),
		loadPayinPipelineOptions({
			fetch: params.fetch,
			log: params.log,
			cookies: params.cookies
		})
	]);

	const defaultPipelineCode = resolveDefaultPipelineCode(
		pipelinesResult.pipelineOptions,
		vanResult.payinVan?.pipelineCode
	);

	const configurationsResult = defaultPipelineCode
		? await loadPaymentMethodConfigurations({
				fetch: params.fetch,
				log: params.log,
				cookies: params.cookies,
				pipelineCode: defaultPipelineCode
			})
		: {
				methodConfigurations: [],
				methodConfigurationsError: null as string | null
			};

	const vaNumber = vanResult.payinVan?.virtualAccountNumber?.trim() ?? '';
	const chargeConfigurationsResult = vaNumber
		? await loadChargeConfigurations({
				fetch: params.fetch,
				log: params.log,
				cookies: params.cookies,
				orgId,
				vaNumber
			})
		: {
				chargeConfigurations: [],
				chargeConfigurationsError: null as string | null
			};

	const commissionConfigurationsResult = vaNumber
		? await loadCommissionConfigurations({
				fetch: params.fetch,
				log: params.log,
				cookies: params.cookies,
				orgId,
				vaNumber
			})
		: {
				commissionConfigurations: [],
				commissionConfigurationsError: null as string | null
			};

	return {
		...vanResult,
		...pipelinesResult,
		defaultPipelineCode,
		methodConfigurations: configurationsResult.methodConfigurations,
		methodConfigurationsError: configurationsResult.methodConfigurationsError,
		chargeConfigurations: chargeConfigurationsResult.chargeConfigurations,
		chargeConfigurationsError: chargeConfigurationsResult.chargeConfigurationsError,
		commissionConfigurations: commissionConfigurationsResult.commissionConfigurations,
		commissionConfigurationsError: commissionConfigurationsResult.commissionConfigurationsError
	};
}
