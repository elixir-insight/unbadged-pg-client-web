import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { getMerchantsWithVans } from '$lib/data/management-van-mock';

const MERCHANT_ID_PARAM = 'merchantId';

export function getSettlementMerchantOptions(): { value: string; label: string }[] {
	return getMerchantsWithVans().map((merchant) => ({
		value: merchant.orgId,
		label: merchant.merchantName
	}));
}

export function getDefaultSettlementMerchantId(): string {
	return getMerchantsWithVans()[0]?.orgId ?? '';
}

export function isValidSettlementMerchantId(merchantId: string): boolean {
	return getMerchantsWithVans().some((merchant) => merchant.orgId === merchantId);
}

export function getCurrentSettlementMerchantId(): string {
	const merchantId = page.url.searchParams.get(MERCHANT_ID_PARAM);
	if (merchantId && isValidSettlementMerchantId(merchantId)) {
		return merchantId;
	}
	return getDefaultSettlementMerchantId();
}

export function setSettlementMerchant(merchantId: string, pathname = page.url.pathname): void {
	const searchParams = new SvelteURLSearchParams(page.url.searchParams);
	searchParams.set(MERCHANT_ID_PARAM, merchantId);
	searchParams.delete('date');
	searchParams.delete('skip');
	const href = `${pathname}?${searchParams.toString()}` as `${typeof pathname}?${string}`;
	goto(resolve(href as '/'), { replaceState: true, keepFocus: true });
}

export function settlementMerchantQueryString(merchantId: string): string {
	return `${MERCHANT_ID_PARAM}=${encodeURIComponent(merchantId)}`;
}

export function appendSettlementMerchantToParams(
	params: SvelteURLSearchParams,
	merchantId: string
): void {
	params.set(MERCHANT_ID_PARAM, merchantId);
}
