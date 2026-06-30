import type { Component } from 'svelte';

export type AppId = 'merchant' | 'management' | 'partner';

export type NavChildItem = {
	title: string;
	href: string;
};

export type NavItem = {
	title: string;
	href: string;
	icon: Component;
	badge?: string;
	children?: NavChildItem[];
};

export type NavGroup = {
	title: string;
	items: NavItem[];
};
