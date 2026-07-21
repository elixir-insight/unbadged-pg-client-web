<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- scoped hrefs append query params after resolve() */
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	type CollectionsBasePath =
		'/merchant/transactions/collections' | '/management/transactions/collections';

	let {
		basePath,
		scopeQuery = ''
	}: {
		basePath: CollectionsBasePath;
		scopeQuery?: string;
	} = $props();

	const ordersHref = $derived.by(() => {
		if (basePath === '/merchant/transactions/collections') {
			return `${resolve('/merchant/transactions/collections/orders')}${scopeQuery}`;
		}
		return `${resolve('/management/transactions/collections/orders')}${scopeQuery}`;
	});

	const paymentsHref = $derived.by(() => {
		if (basePath === '/merchant/transactions/collections') {
			return `${resolve('/merchant/transactions/collections/payments')}${scopeQuery}`;
		}
		return `${resolve('/management/transactions/collections/payments')}${scopeQuery}`;
	});

	const tabs = $derived([
		{ label: 'Payments', href: paymentsHref },
		{ label: 'Orders', href: ordersHref }
	]);
</script>

<nav class="flex gap-1 border-b border-border px-4">
	{#each tabs as tab (tab.label)}
		<a
			href={tab.href}
			class="relative px-3 pt-3.5 pb-2.5 text-sm font-medium transition-colors {page.url.pathname.startsWith(
				tab.href.split('?')[0]
			)
				? '-mb-px border-b-2 border-foreground text-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{tab.label}
		</a>
	{/each}
</nav>
