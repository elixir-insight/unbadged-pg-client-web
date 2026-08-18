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
	import NotificationBell from '$lib/components/reusable/notification-bell/notification-bell.svelte';
	import { breadcrumb } from '$lib/stores/breadcrumb.svelte';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
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

	const notificationsHref = $derived(
		app === 'management'
			? ('/management/notifications' as const)
			: app === 'merchant'
				? ('/merchant/notifications' as const)
				: undefined
	);

	const allItems = $derived(navConfig[app].flatMap((g) => g.items));

	const rootRouteIds: Record<AppId, string> = {
		management: '/management',
		merchant: '/merchant',
		partner: '/partner'
	};

	const isDashboard = $derived(
		page.route.id === rootRouteIds[app] || (page.route.id?.includes('/(dashboard)') ?? false)
	);

	const pageTitle = $derived(
		allItems.find((i) => page.url.pathname === i.href)?.title ??
			allItems.find((i) => page.url.pathname.startsWith(i.href + '/'))?.title ??
			appLabels[app]
	);

	const userName = $derived(merchantSession.session?.merchantName ?? 'User');
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
		if (breadcrumb.items.length > 0) {
			return breadcrumb.items;
		}

		const root = rootRoutes[app];
		const rest = page.url.pathname.startsWith(root) ? page.url.pathname.slice(root.length) : '';

		const segments = rest.split('/').filter(Boolean);

		const items: { href: string; label: string }[] = [];

		segments.forEach((seg, index) => {
			const href = root + '/' + segments.slice(0, index + 1).join('/');

			const custom = breadcrumbRoutes.find((route) => route.matcher.test(href));
			if (custom) {
				items.push({ href, label: custom.title });
				return;
			}

			const navTitle = navTitleMap.get(href);
			if (navTitle) {
				items.push({ href, label: navTitle });
				return;
			}

			// This segment is a literal path piece (e.g. "view-role") that only exists
			// to lead into a dynamic id further down the path — it isn't its own
			// breadcrumb level, so skip it instead of falling back to a formatted label.
			const isPrefixOfDynamicRoute = breadcrumbRoutes.some((route) =>
				route.matcher.test(href + '/__probe__')
			);
			if (isPrefixOfDynamicRoute) return;

			items.push({ href, label: formatSegment(seg) });
		});

		// Remove numeric ID segments when no custom breadcrumb matched
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
		class="flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden bg-background md:bg-muted md:p-4"
	>
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl md:shadow-sm md:ring-1 md:ring-border"
		>
			<header
				class={cn(
					'flex h-14 shrink-0 items-center gap-3 px-4',
					!isDashboard && 'border-b border-border'
				)}
			>
				<!-- Mobile: open drawer -->
				<button
					class="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-accent hover:text-accent-foreground md:hidden"
					onclick={() => (isMobileOpen = true)}
					aria-label="Open navigation"
				>
					<Menu class="h-4 w-4" />
				</button>

				{#if isDashboard && (app === 'management' || app === 'merchant')}
					<p class="min-w-0 truncate text-sm text-muted-foreground">
						Welcome, <span class="font-bold text-foreground">{userName}</span>
					</p>
				{/if}

				{#if !isDashboard}
					<Breadcrumb items={breadcrumbItems} class="text-sm font-semibold" />
				{/if}

				{#if app === 'management' || app === 'merchant'}
					<NotificationBell class="ml-auto" viewAllHref={notificationsHref} />
				{/if}
			</header>

			<div
				class={cn(
					'app-shell-content min-h-0 flex-1 overflow-x-clip overflow-y-auto',
					isDashboard && 'md:overflow-hidden'
				)}
			>
				<div
					class={cn('min-h-full', isDashboard ? 'p-5 md:flex md:h-full md:flex-col md:p-6' : 'p-5')}
				>
					{@render children()}
				</div>
			</div>
		</div>
	</main>
</div>
