import type { Component } from 'svelte';

export type AppId = 'merchant' | 'management' | 'partner';

export type NavChildItem = {
	title: string;
	href: string;
};
export type MerchantService = 'payin' | 'payout';

export type NavItem = {
	title: string;
	href: string;
	icon: Component;
	badge?: string;
	children?: NavChildItem[];
	service?: MerchantService;
};

export type NavGroup = {
	title?: string;
	items: NavItem[];
};
