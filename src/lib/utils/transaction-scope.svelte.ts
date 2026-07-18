/* eslint-disable svelte/no-navigation-without-resolve, svelte/prefer-svelte-reactivity -- scope query params are appended after resolve() */
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getDefaultScope, resolveScope } from '$lib/data/management-van-mock';
import type { TransactionScope } from '$lib/types/virtual-account';
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
	return resolveScope(merchantId, vanId);
}

export function setScope(scope: TransactionScope, pathname = page.url.pathname): void {
	const searchParams = new URLSearchParams();
	searchParams.set('merchantId', scope.orgId);
	searchParams.set('vanId', scope.vanId);
	goto(`${pathname}?${searchParams.toString()}`, { replaceState: true, keepFocus: true });
}

export function setMerchant(orgId: string): void {
	const currentVanId = page.url.searchParams.get('vanId');
	const scope = resolveScope(orgId, currentVanId);
	setScope(scope);
}

export function setVan(vanId: string): void {
	const orgId = page.url.searchParams.get('merchantId') ?? getDefaultScope().orgId;
	setScope({ orgId, vanId });
}

export function getCurrentScope(): TransactionScope {
	return readScopeFromUrl(page.url.searchParams);
}

export function managementCollectionsPath(
	subpath: 'orders' | 'payments',
	scope?: TransactionScope
): string {
	const activeScope = scope ?? getDefaultScope();
	const base = resolvePath(`/management/transactions/collections/${subpath}`);
	return buildScopedHref(base, activeScope);
}

export function managementDisbursementsPath(scope?: TransactionScope): string {
	const activeScope = scope ?? getDefaultScope();
	const base = resolvePath('/management/transactions/disbursements');
	return buildScopedHref(base, activeScope);
}

export function scopedListHref(path: ManagementListPath, scope: TransactionScope): string {
	return `${resolvePath(path)}${scopeQueryString(scope)}`;
}
