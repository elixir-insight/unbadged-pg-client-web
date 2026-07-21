import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { SvelteURLSearchParams } from 'svelte/reactivity';

const MERCHANT_ID_PARAM = 'merchantId';

export function getCurrentSettlementMerchantId(
	merchantOptions: { value: string; label: string }[]
): string {
	const merchantId = page.url.searchParams.get(MERCHANT_ID_PARAM);
	if (merchantId && merchantOptions.some((merchant) => merchant.value === merchantId)) {
		return merchantId;
	}
	return merchantOptions[0]?.value ?? '';
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
