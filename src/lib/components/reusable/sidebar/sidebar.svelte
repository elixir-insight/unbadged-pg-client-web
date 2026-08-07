<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import type { AppId, NavGroup } from '$lib/navigation/types';
	import { managementNav } from '$lib/navigation/management-nav';
	import { merchantNav } from '$lib/navigation/merchant-nav';
	import { partnerNav } from '$lib/navigation/partner-nav';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { formatUserType, getUserInitials } from '$lib/stores/auth/display';
	import ProfileCard from '../profile-card/profile-card.svelte';
	import { X } from '$lib/assets/icons';
	import { branding } from '$lib/branding';

	const Logo = branding.assets.logoLight;
	let {
		app,
		isMobileOpen = $bindable(false)
	}: {
		app: AppId;
		isMobileOpen?: boolean;
	} = $props();

	const navConfig: Record<AppId, NavGroup[]> = {
		management: managementNav,
		merchant: merchantNav,
		partner: partnerNav
	};

	const navGroups = $derived(navConfig[app]);

	const visibleNavGroups = $derived(
		app !== 'partner'
			? navGroups
					.map((g) => ({
						...g,
						items: g.items.filter((i) => !i.service || merchantSession.hasService(i.service))
					}))
					.filter((g) => g.items.length > 0)
			: navGroups
	);

	const settingsHrefs: Partial<Record<AppId, string>> = {
		management: '/management/settings',
		merchant: '/merchant/settings'
	};

	const profileProps = $derived(
		merchantSession.session?.merchantName
			? {
					userName: merchantSession.session.merchantName,
					userRole: formatUserType(merchantSession.session.userType ?? ''),
					userInitials: getUserInitials(merchantSession.session.merchantName),
					confirmLogout: app === 'management' || app === 'merchant',
					...(app === 'merchant' ? { vanNumber: merchantSession.session.organizationId } : {}),
					...(settingsHrefs[app] ? { settingsHref: settingsHrefs[app] } : {})
				}
			: null
	);

	const rootRoutes: Record<AppId, string> = {
		management: '/management',
		merchant: '/merchant',
		partner: '/partner'
	};

	function isActive(href: string): boolean {
		if (page.url.pathname === href) return true;
		if (href === rootRoutes[app]) return page.route.id?.includes('/(dashboard)') ?? false;
		return page.url.pathname.startsWith(href + '/');
	}

	$effect(() => {
		if (page.url.pathname) isMobileOpen = false;
	});
</script>

<!-- Mobile backdrop -->
{#if isMobileOpen}
	<div
		class="fixed inset-0 z-40 bg-foreground/50 md:hidden"
		role="presentation"
		onclick={() => (isMobileOpen = false)}
		onkeydown={(e) => {
			if (e.key === 'Escape') isMobileOpen = false;
		}}
	></div>
{/if}

<aside
	class={cn(
		'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out',
		'md:relative md:z-auto md:translate-x-0',
		isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
	)}
>
	<!-- Sidebar header -->
	<div
		class="mt-4 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-3"
	>
		<a
			href={resolve(...([rootRoutes[app]] as Parameters<typeof resolve>))}
			aria-label="Go to dashboard"
			class="flex min-w-0 items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<Logo width="168" class="h-auto w-40 shrink-0" />
		</a>

		<!-- Mobile: close drawer -->
		<button
			class="relative flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
			onclick={() => (isMobileOpen = false)}
			aria-label="Close navigation"
		>
			<X class="h-4 w-4" />
		</button>
	</div>

	<!-- Navigation groups -->
	<nav class="flex-1 overflow-y-auto px-2 py-6" aria-label="Main navigation">
		{#each visibleNavGroups as group (group.title)}
			<div class="mt-3 first:mt-0">
				<p class="mb-1 px-2 text-xs tracking-wider text-muted-foreground">
					{group.title}
				</p>

				<ul class="space-y-0.5" role="list">
					{#each group.items as item (item.href)}
						<li class="relative">
							{#if isActive(item.href)}
								<span
									class="sidebar-active-indicator absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-primary"
								></span>
							{/if}
							<a
								href={resolve(...([item.href] as Parameters<typeof resolve>))}
								class={cn(
									'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
									isActive(item.href)
										? 'bg-sidebar-accent text-sidebar-accent-foreground'
										: 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
								)}
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<item.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
								<span class="flex-1 truncate">{item.title}</span>
								{#if item.badge}
									<span
										class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary-foreground"
									>
										{item.badge}
									</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>

	<!-- Profile card -->
	{#if profileProps}
		<ProfileCard {...profileProps} />
	{/if}
</aside>
