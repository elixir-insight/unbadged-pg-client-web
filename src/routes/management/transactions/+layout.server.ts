import type { LayoutServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapDashboardMerchantsToOptions } from '$lib/server/domains/organization/mappers/from-api/dashboard-merchants';
import { virtualAccountClient } from '$lib/server/domains/virtual-account/client';
import { mapOrganizationVirtualAccounts } from '$lib/server/domains/virtual-account/mappers/from-api/organization-virtual-accounts';
import type { MerchantOption } from '$lib/utils/management-merchant-catalog';
import { resolveSelectedOrgId } from '$lib/utils/management-merchant-catalog';
import type { VirtualAccount } from '$lib/types/virtual-account';

export const load: LayoutServerLoad = async ({ cookies, fetch, locals, depends, url }) => {
	depends('management-transactions:merchants');
	depends('management-transactions:vans');

	const log = locals.logger.child({ action: 'management-transactions-merchants' });
	const empty = {
		merchants: [] as MerchantOption[],
		vans: [] as VirtualAccount[],
		selectedOrgId: null as string | null,
		merchantsError: null as string | null,
		vansError: null as string | null
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return { ...empty, merchantsError: error.message };
		}
		throw error;
	}

	const merchantsResult = await organizationClient.listDashboardMerchants(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken
	);

	if (!merchantsResult.ok) {
		log.warn(
			{ kind: merchantsResult.error.kind, message: merchantsResult.error.message },
			'GET management dashboard merchants failed'
		);
		return { ...empty, merchantsError: merchantsResult.error.message };
	}

	const merchants = mapDashboardMerchantsToOptions(merchantsResult.data.data);
	const selectedOrgId = resolveSelectedOrgId(merchants, url.searchParams.get('merchantId'));

	if (!selectedOrgId) {
		return {
			merchants,
			vans: [],
			selectedOrgId: null,
			merchantsError: null,
			vansError: merchants.length === 0 ? 'No merchants available' : null
		};
	}

	const merchantName =
		merchants.find((merchant) => merchant.orgId === selectedOrgId)?.merchantName ?? selectedOrgId;

	const vansResult = await virtualAccountClient.listByOrganization(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		selectedOrgId
	);

	if (!vansResult.ok) {
		log.warn(
			{
				kind: vansResult.error.kind,
				message: vansResult.error.message,
				orgId: selectedOrgId
			},
			'GET management organization virtual accounts failed'
		);
		return {
			merchants,
			vans: [],
			selectedOrgId,
			merchantsError: null,
			vansError: vansResult.error.message
		};
	}

	return {
		merchants,
		vans: mapOrganizationVirtualAccounts(vansResult.data.data, selectedOrgId, merchantName),
		selectedOrgId,
		merchantsError: null,
		vansError: null
	};
};
