import type { DashboardMerchant } from '../../schema';

export type DashboardMerchantOption = {
	orgId: string;
	merchantName: string;
};

/**
 * Maps `/api/v1/management/dashboard/merchants` into merchant dropdown options.
 * VAN options are loaded separately per org.
 */
export function mapDashboardMerchantsToOptions(
	merchants: DashboardMerchant[]
): DashboardMerchantOption[] {
	const seen = new Set<string>();

	return merchants.flatMap((merchant) => {
		const orgId = merchant.displayOrgId.trim();
		if (!orgId || seen.has(orgId)) return [];

		const profileType = merchant.profileType?.trim().toUpperCase() ?? '';
		if (profileType && profileType !== 'MERCHANT') return [];

		seen.add(orgId);

		return [
			{
				orgId,
				merchantName: merchant.legalCompanyName?.trim() || merchant.email?.trim() || orgId
			}
		];
	});
}

/** @deprecated Prefer mapDashboardMerchantsToOptions + org VAN API */
export function mapDashboardMerchantsToCatalog(merchants: DashboardMerchant[]) {
	return mapDashboardMerchantsToOptions(merchants).map((merchant) => ({
		...merchant,
		vans: []
	}));
}
