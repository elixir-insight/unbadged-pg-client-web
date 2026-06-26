<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { AppId } from '$lib/navigation/types';
	import { managementNav } from '$lib/navigation/management-nav';
	import { merchantNav } from '$lib/navigation/merchant-nav';
	import { partnerNav } from '$lib/navigation/partner-nav';
	import Sidebar from '../sidebar/sidebar.svelte';
	import { Menu } from '$lib/assets/icons';
	import Breadcrumb from '$lib/components/reusable/breadcrumb/breadcrumb.svelte';

	let {
		app,
		children
	}: {
		app: AppId;
		children: Snippet;
	} = $props();

	let isMobileOpen = $state(false);

	const rootRoutes: Record<AppId, string> = {
		management: resolve('/management'),
		merchant: resolve('/merchant'),
		partner: resolve('/partner')
	};

	const navConfig = { management: managementNav, merchant: merchantNav, partner: partnerNav };

	const appLabels: Record<AppId, string> = {
		management: 'Management',
		merchant: 'Merchant',
		partner: 'Partner'
	};

	const allItems = $derived(navConfig[app].flatMap((g) => g.items));

	const isDashboard = $derived(page.url.pathname === rootRoutes[app]);

	const pageTitle = $derived(
		allItems.find((i) => page.url.pathname === i.href)?.title ??
			allItems.find((i) => page.url.pathname.startsWith(i.href + '/'))?.title ??
			appLabels[app]
	);

	const navTitleMap = $derived(new Map(allItems.map((i) => [i.href, i.title])));

	function formatSegment(seg: string): string {
		return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const breadcrumbItems = $derived.by(() => {
		const root = rootRoutes[app];
		const rest = page.url.pathname.startsWith(root) ? page.url.pathname.slice(root.length) : '';
		const segments = rest.split('/').filter(Boolean);

		return segments.map((seg, i) => {
			const href = root + '/' + segments.slice(0, i + 1).join('/');
			return { label: navTitleMap.get(href) ?? formatSegment(seg), href };
		});
	});
</script>

<svelte:head>
	<title>{pageTitle} | ElixirPay</title>
	<meta property="og:title" content="{pageTitle} | ElixirPay" />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<div class="flex h-screen overflow-hidden bg-background">
	<Sidebar {app} bind:isMobileOpen />

	<main class="flex min-w-0 flex-1 flex-col overflow-y-auto bg-muted p-4">
		<div
			class="flex h-full flex-col overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border"
		>
			{#if !isDashboard}
				<header class="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
					<!-- Mobile: open drawer -->
					<button
						class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
						onclick={() => (isMobileOpen = true)}
						aria-label="Open navigation"
					>
						<Menu class="h-4 w-4" />
					</button>

					<!-- Desktop: decorative icon -->
					<!-- <PanelLeft
						class="hidden h-4 w-4 shrink-0 text-muted-foreground md:block"
						aria-hidden="true"
					/> -->

					<Breadcrumb items={breadcrumbItems} class="text-sm font-semibold" />
				</header>
			{/if}

			<div class="app-shell-content flex-1 overflow-y-auto p-5">
				{@render children()}
			</div>
		</div>
	</main>
</div>
