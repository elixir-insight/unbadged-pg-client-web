class PageHeaderStore {
	breadcrumbs = $state<{ label: string; href: string }[] | null>(null);
}

export const pageHeaderStore = new PageHeaderStore();
