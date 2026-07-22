import type { TransactionScope, VirtualAccount } from '$lib/types/virtual-account';

export type MerchantOption = {
	orgId: string;
	merchantName: string;
};

export function findMerchant(
	merchants: MerchantOption[],
	orgId: string | null | undefined
): MerchantOption | null {
	if (!orgId) return null;
	return merchants.find((merchant) => merchant.orgId === orgId) ?? null;
}

export function findVan(
	vans: VirtualAccount[],
	vanId: string | null | undefined
): VirtualAccount | null {
	if (!vanId) return null;
	return vans.find((van) => van.vanId === vanId) ?? null;
}

export function resolveSelectedOrgId(
	merchants: MerchantOption[],
	merchantId: string | null
): string | null {
	if (merchantId && findMerchant(merchants, merchantId)) return merchantId;
	return merchants[0]?.orgId ?? null;
}

export function resolveScopeFromMerchantsAndVans(
	merchants: MerchantOption[],
	vans: VirtualAccount[],
	merchantId: string | null,
	vanId: string | null
): TransactionScope | null {
	const orgId = resolveSelectedOrgId(merchants, merchantId);
	if (!orgId) return null;

	const selectedVan = findVan(vans, vanId) ?? vans[0] ?? null;
	if (!selectedVan) return { orgId, vanId: '' };

	return { orgId, vanId: selectedVan.vanId };
}

export function getDefaultScope(
	merchants: MerchantOption[],
	vans: VirtualAccount[]
): TransactionScope | null {
	return resolveScopeFromMerchantsAndVans(merchants, vans, null, null);
}
