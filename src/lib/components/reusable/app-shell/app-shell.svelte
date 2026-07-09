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
	import { cn } from '$lib/utils';

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
	const breadcrumbRoutes = $derived(
		allItems.flatMap((item) =>
			(item.breadcrumbChildren ?? []).map((child) => ({
				...child,
				parentHref: item.href
			}))
		)
	);

	const navTitleMap = $derived(new Map(allItems.map((i) => [i.href, i.title])));

	function formatSegment(seg: string): string {
		return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const breadcrumbItems = $derived.by(() => {
		const root = rootRoutes[app];
		const rest = page.url.pathname.startsWith(root) ? page.url.pathname.slice(root.length) : '';

		const segments = rest.split('/').filter(Boolean);

		const items = segments.map((seg, index) => {
			const href = root + '/' + segments.slice(0, index + 1).join('/');

			const custom = breadcrumbRoutes.find((route) => route.matcher.test(href));

			return {
				href,
				label: custom?.title ?? navTitleMap.get(href) ?? formatSegment(seg)
			};
		});

		// Remove numeric ID segments when a custom breadcrumb matched
		return items.filter(
			(item) => !/\/\d+$/.test(item.href) || item.label !== item.href.split('/').pop()
		);
	});
</script>

<svelte:head>
	<title>{pageTitle} | ElixirPay</title>
	<meta property="og:title" content="{pageTitle} | ElixirPay" />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<div class="flex h-screen overflow-hidden bg-background">
	<Sidebar {app} bind:isMobileOpen />

	<main
		class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:bg-muted md:p-4"
	>
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl md:shadow-sm md:ring-1 md:ring-border"
		>
			<header
				class={`flex h-14 shrink-0 items-center gap-3 border-b border-border px-4${isDashboard ? ' md:hidden' : ''}`}
			>
				<!-- Mobile: open drawer -->
				<button
					class="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-accent hover:text-accent-foreground md:hidden"
					onclick={() => (isMobileOpen = true)}
					aria-label="Open navigation"
				>
					<Menu class="h-4 w-4" />
				</button>

				{#if !isDashboard}
					<Breadcrumb items={breadcrumbItems} class="text-sm font-semibold" />
				{/if}
			</header>

			<div
				class={cn(
					'app-shell-content min-h-0 flex-1 overflow-x-clip overflow-y-auto',
					isDashboard && 'xl:overflow-hidden'
				)}
			>
				<div class={cn('min-h-full p-5', isDashboard && 'xl:flex xl:h-full xl:flex-col')}>
					{@render children()}
				</div>
			</div>
		</div>
	</main>
</div>
