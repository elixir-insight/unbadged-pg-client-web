import type { VirtualAccount } from '$lib/types/virtual-account';
import type { MerchantOption } from '$lib/utils/management-merchant-catalog';
import { findVan, resolveScopeFromMerchantsAndVans } from '$lib/utils/management-merchant-catalog';

type TransactionsLayoutData = {
	merchants?: MerchantOption[];
	vans?: VirtualAccount[];
	merchantsError?: string | null;
	vansError?: string | null;
};

export function resolveVirtualAccountNumber(
	parentData: TransactionsLayoutData,
	merchantId: string | null,
	vanId: string | null
): { virtualAccountNumber?: string; scopeError: string | null } {
	if (parentData.merchantsError) {
		return { scopeError: parentData.merchantsError };
	}
	if (parentData.vansError) {
		return { scopeError: parentData.vansError };
	}

	const merchants = parentData.merchants ?? [];
	const vans = parentData.vans ?? [];

	if (merchants.length === 0) {
		return { scopeError: 'No merchants are available' };
	}
	if (vans.length === 0) {
		return { scopeError: 'No virtual accounts are available for this merchant' };
	}

	const scope = resolveScopeFromMerchantsAndVans(merchants, vans, merchantId, vanId);
	if (!scope?.vanId) {
		return { scopeError: 'Unable to resolve merchant virtual account' };
	}

	const van = findVan(vans, scope.vanId);
	if (!van?.vanNumber) {
		return { scopeError: 'Selected virtual account was not found' };
	}

	return { virtualAccountNumber: van.vanNumber, scopeError: null };
}
