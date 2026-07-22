import type { LayoutServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';

export interface MerchantOption {
	value: string;
	label: string;
}

function mapMerchantOptions(
	merchants: {
		displayOrgId: string;
		legalCompanyName?: string | null;
		email?: string | null;
	}[]
): MerchantOption[] {
	const seenOrgIds = new Set<string>();

	return merchants.flatMap((merchant) => {
		const orgId = merchant.displayOrgId.trim();
		if (!orgId || seenOrgIds.has(orgId)) return [];
		seenOrgIds.add(orgId);

		return [
			{
				value: orgId,
				label: merchant.legalCompanyName?.trim() || merchant.email?.trim() || orgId
			}
		];
	});
}

export const load: LayoutServerLoad = async ({ cookies, fetch, locals, depends }) => {
	depends('management-settlements:merchants');

	const log = locals.logger.child({ action: 'management-settlements-merchants' });

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return { merchantOptions: [], merchantsError: error.message };
		}
		throw error;
	}

	const result = await organizationClient.listDashboardMerchants(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken
	);

	if (!result.ok) {
		log.warn(
			{ kind: result.error.kind, message: result.error.message },
			'GET management dashboard merchants failed'
		);
		return { merchantOptions: [], merchantsError: result.error.message };
	}

	return {
		merchantOptions: mapMerchantOptions(result.data.data),
		merchantsError: null
	};
};
