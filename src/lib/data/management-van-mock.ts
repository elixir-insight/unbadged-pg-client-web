import type { TransactionScope, VirtualAccount } from '$lib/types/virtual-account';

export interface MerchantWithVans {
	orgId: string;
	merchantName: string;
	vans: VirtualAccount[];
}

export const VAN_CATALOG: VirtualAccount[] = [
	{
		vanId: 'VAN-1001',
		vanNumber: 'VA9823410001',
		orgId: 'ORG-1000',
		merchantName: 'Northwind Capital',
		status: 'active'
	},
	{
		vanId: 'VAN-1002',
		vanNumber: 'VA9823410002',
		orgId: 'ORG-1000',
		merchantName: 'Northwind Capital',
		status: 'active'
	},
	{
		vanId: 'VAN-3001',
		vanNumber: 'VA9823430001',
		orgId: 'ORG-1003',
		merchantName: 'Vertex Robotics',
		status: 'active'
	},
	{
		vanId: 'VAN-3002',
		vanNumber: 'VA9823430002',
		orgId: 'ORG-1003',
		merchantName: 'Vertex Robotics',
		status: 'active'
	},
	{
		vanId: 'VAN-6001',
		vanNumber: 'VA9823460001',
		orgId: 'ORG-1006',
		merchantName: 'Stellar Foods',
		status: 'active'
	}
];

export function getMerchantsWithVans(): MerchantWithVans[] {
	const merchantMap = new Map<string, MerchantWithVans>();

	for (const van of VAN_CATALOG) {
		const existing = merchantMap.get(van.orgId);
		if (existing) {
			existing.vans.push(van);
		} else {
			merchantMap.set(van.orgId, {
				orgId: van.orgId,
				merchantName: van.merchantName,
				vans: [van]
			});
		}
	}

	return Array.from(merchantMap.values());
}

export function getVansByOrgId(orgId: string): VirtualAccount[] {
	return VAN_CATALOG.filter((van) => van.orgId === orgId);
}

export function getVanById(vanId: string): VirtualAccount | null {
	return VAN_CATALOG.find((van) => van.vanId === vanId) ?? null;
}

export function getDefaultScope(): TransactionScope {
	const firstVan = VAN_CATALOG[0];
	return { orgId: firstVan.orgId, vanId: firstVan.vanId };
}

export function isValidScope(scope: TransactionScope): boolean {
	const van = getVanById(scope.vanId);
	return van !== null && van.orgId === scope.orgId;
}

export function resolveScope(merchantId: string | null, vanId: string | null): TransactionScope {
	if (merchantId && vanId) {
		const candidate = { orgId: merchantId, vanId };
		if (isValidScope(candidate)) return candidate;
	}

	if (merchantId) {
		const vans = getVansByOrgId(merchantId);
		if (vans.length > 0) {
			return { orgId: merchantId, vanId: vans[0].vanId };
		}
	}

	return getDefaultScope();
}

export type ScopeFields = {
	orgId: string;
	vanId: string;
	vanNumber: string;
	merchantName: string;
};

export function scopeFieldsFromVan(van: VirtualAccount): ScopeFields {
	return {
		orgId: van.orgId,
		vanId: van.vanId,
		vanNumber: van.vanNumber,
		merchantName: van.merchantName
	};
}

export function scopeFieldsFromScope(scope: TransactionScope): ScopeFields | null {
	const van = getVanById(scope.vanId);
	if (!van || van.orgId !== scope.orgId) return null;
	return scopeFieldsFromVan(van);
}

export function matchesScope(
	item: { orgId: string; vanId: string },
	scope?: TransactionScope
): boolean {
	if (!scope) return true;
	return item.orgId === scope.orgId && item.vanId === scope.vanId;
}
