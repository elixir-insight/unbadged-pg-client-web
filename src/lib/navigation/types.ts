//navigation/types.ts
import type { Component } from 'svelte';
import type { RbacAction, RbacModule } from '$lib/rbac/types';

export type AppId = 'merchant' | 'management' | 'partner';

export type MerchantService = 'payin' | 'payout';

export type NavRequiredPermission = { module: RbacModule; action: RbacAction };

export type NavItem = {
	title: string;
	href: string;
	icon: Component;
	badge?: string;
	service?: MerchantService;
	/** Hide this item unless the current user has this permission. */
	requiredPermission?: NavRequiredPermission;
	/** Hide this item unless the user has at least one of these permissions. */
	requiredPermissionAnyOf?: NavRequiredPermission[];
	children?: NavChild[];
	breadcrumbChildren?: {
		matcher: RegExp;
		title: string;
	}[];
};

export type NavChild = {
	title: string;
	href: string;
	icon: Component;
	badge?: string;
	service?: MerchantService;
	requiredPermission?: NavRequiredPermission;
	requiredPermissionAnyOf?: NavRequiredPermission[];
	breadcrumbChildren?: {
		matcher: RegExp;
		title: string;
	}[];
};

export type NavGroup = {
	title?: string;
	items: NavItem[];
};
