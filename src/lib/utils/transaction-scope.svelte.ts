/* eslint-disable svelte/no-navigation-without-resolve, svelte/prefer-svelte-reactivity -- scope query params are appended after resolve() */
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import type { MerchantOption } from '$lib/utils/management-merchant-catalog';
import type { TransactionScope, VirtualAccount } from '$lib/types/virtual-account';
import {
	getDefaultScope,
	resolveScopeFromMerchantsAndVans
} from '$lib/utils/management-merchant-catalog';
import {
	appendScopeToPath,
	buildScopedHref,
	readScopeFromSearchParams,
	scopeQueryString
} from '$lib/utils/transaction-scope';

export { appendScopeToPath, buildScopedHref, scopeQueryString };

type ManagementListPath =
	| '/management/transactions/collections/orders'
	| '/management/transactions/collections/payments'
	| '/management/transactions/disbursements';

type ManagementDetailPath =
	| '/management/transactions/collections/orders/[orderId]'
	| '/management/transactions/collections/payments/[txnId]'
	| '/management/transactions/disbursements/[id]';

type ResolveFn = (path: string, params?: Record<string, string>) => string;

const resolvePath = resolve as unknown as ResolveFn;

function getMerchants(): MerchantOption[] {
	const merchants = page.data.merchants;
	return Array.isArray(merchants) ? (merchants as MerchantOption[]) : [];
}

function getVans(): VirtualAccount[] {
	const vans = page.data.vans;
	return Array.isArray(vans) ? (vans as VirtualAccount[]) : [];
}

/** Appends scope query params after a path from resolve(). */
export function gotoWithScope(resolvedPath: string, scope: TransactionScope): void {
	goto(`${resolvedPath}${scopeQueryString(scope)}`);
}

export function gotoScopedRoute(
	path: ManagementDetailPath,
	params: Record<string, string>,
	scope: TransactionScope
): void {
	gotoWithScope(resolvePath(path, params), scope);
}

export function gotoScopedPath(path: ManagementListPath, scope: TransactionScope): void {
	gotoWithScope(resolvePath(path), scope);
}

export function readScopeFromUrl(searchParams: URLSearchParams): TransactionScope {
	const { merchantId, vanId } = readScopeFromSearchParams(searchParams);
	return (
		resolveScopeFromMerchantsAndVans(getMerchants(), getVans(), merchantId, vanId) ?? {
			orgId: merchantId ?? '',
			vanId: vanId ?? ''
		}
	);
}

export function setScope(scope: TransactionScope, pathname = page.url.pathname): void {
	const searchParams = new URLSearchParams();
	searchParams.set('merchantId', scope.orgId);
	searchParams.set('vanId', scope.vanId);
	goto(`${pathname}?${searchParams.toString()}`, { replaceState: true, keepFocus: true });
}

export function setMerchant(orgId: string): void {
	setScope({ orgId, vanId: '' });
}

export function setVan(vanId: string): void {
	const orgId =
		page.url.searchParams.get('merchantId') ??
		getDefaultScope(getMerchants(), getVans())?.orgId ??
		'';
	if (!orgId) return;
	setScope({ orgId, vanId });
}

export function getCurrentScope(): TransactionScope {
	return readScopeFromUrl(page.url.searchParams);
}

export function managementCollectionsPath(
	subpath: 'orders' | 'payments',
	scope?: TransactionScope
): string {
	const activeScope = scope ??
		getDefaultScope(getMerchants(), getVans()) ?? { orgId: '', vanId: '' };
	const base = resolvePath(`/management/transactions/collections/${subpath}`);
	return buildScopedHref(base, activeScope);
}

export function managementDisbursementsPath(scope?: TransactionScope): string {
	const activeScope = scope ??
		getDefaultScope(getMerchants(), getVans()) ?? { orgId: '', vanId: '' };
	const base = resolvePath('/management/transactions/disbursements');
	return buildScopedHref(base, activeScope);
}

export function scopedListHref(path: ManagementListPath, scope: TransactionScope): string {
	return `${resolvePath(path)}${scopeQueryString(scope)}`;
}
