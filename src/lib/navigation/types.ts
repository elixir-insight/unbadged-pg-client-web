import type { Component } from 'svelte';

export type AppId = 'merchant' | 'management' | 'partner';

export type NavItem = {
	title: string;
	href: string;
	icon: Component;
	badge?: string;
};

export type NavGroup = {
	title: string;
	items: NavItem[];
};
