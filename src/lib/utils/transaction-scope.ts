import type { TransactionScope } from '$lib/types/virtual-account';

const MERCHANT_ID_PARAM = 'merchantId';
const VAN_ID_PARAM = 'vanId';

export function scopeQueryString(scope: TransactionScope): string {
	return `?${MERCHANT_ID_PARAM}=${encodeURIComponent(scope.orgId)}&${VAN_ID_PARAM}=${encodeURIComponent(scope.vanId)}`;
}

export function buildScopedHref(path: string, scope: TransactionScope): string {
	return `${path}${scopeQueryString(scope)}`;
}

export function readScopeFromSearchParams(searchParams: URLSearchParams): {
	merchantId: string | null;
	vanId: string | null;
} {
	return {
		merchantId: searchParams.get(MERCHANT_ID_PARAM),
		vanId: searchParams.get(VAN_ID_PARAM)
	};
}

export function appendScopeToPath(resolvedPath: string, scope: TransactionScope): string {
	return `${resolvedPath}${scopeQueryString(scope)}`;
}
