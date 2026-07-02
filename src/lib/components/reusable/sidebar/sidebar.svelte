<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import type { AppId, NavGroup, NavItem } from '$lib/navigation/types';
	import { managementNav } from '$lib/navigation/management-nav';
	import { merchantNav } from '$lib/navigation/merchant-nav';
	import { partnerNav } from '$lib/navigation/partner-nav';
	import ProfileCard from '../profile-card/profile-card.svelte';
	import { CompanyLogoLight, X, ChevronDown } from '$lib/assets/icons';

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

	const rootRoutes: Record<AppId, string> = {
		management: '/management',
		merchant: '/merchant',
		partner: '/partner'
	};

	function isActive(href: string): boolean {
		if (page.url.pathname === href) return true;
		if (href === rootRoutes[app]) return false;
		return page.url.pathname.startsWith(href + '/');
	}

	function isParentActive(item: NavItem): boolean {
		return item.children?.some((child) => isActive(child.href)) ?? false;
	}

	// null = no manual override yet, fall back to whichever parent's child route is active.
	// '' = user explicitly collapsed everything.
	let expandedTitle = $state<string | null>(null);

	const autoExpandedTitle = $derived(
		navGroups.flatMap((group) => group.items).find((item) => isParentActive(item))?.title ?? ''
	);

	const currentExpanded = $derived(expandedTitle === null ? autoExpandedTitle : expandedTitle);

	function isExpanded(item: NavItem): boolean {
		return currentExpanded === item.title;
	}

	function toggleExpanded(title: string) {
		expandedTitle = currentExpanded === title ? '' : title;
	}

	$effect(() => {
		if (page.url.pathname) isMobileOpen = false;
	});
</script>

<!-- Mobile backdrop -->
{#if isMobileOpen}
	<div
		class="fixed inset-0 z-40 bg-black/50 md:hidden"
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
		class="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border mt-4.5 px-3"
	>
		<div class="flex min-w-0 items-center gap-2">
			<CompanyLogoLight class=" shrink-0" />
		</div>

		<!-- Mobile: close drawer -->
		<button
			class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
			onclick={() => (isMobileOpen = false)}
			aria-label="Close navigation"
		>
			<X class="h-4 w-4" />
		</button>
	</div>

	<!-- Navigation groups -->
	<nav class="flex-1 overflow-y-auto px-2 py-2" aria-label="Main navigation">
		{#each navGroups as group (group.title)}
			<div class="mt-3 first:mt-0">
				<p class="mb-1 px-2 text-xs tracking-wider text-muted-foreground">
					{group.title}
				</p>

				<ul class="space-y-0.5" role="list">
					{#each group.items as item (item.title)}
						<li class="relative">
							{#if item.children}
								{@const parentActive = isParentActive(item)}
								{#if parentActive}
									<span
										class="sidebar-active-indicator absolute left-0 inset-y-1 w-0.5 rounded-r-full bg-primary"
									></span>
								{/if}
								<button
									type="button"
									class={cn(
										'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
										parentActive
											? 'bg-sidebar-accent text-sidebar-accent-foreground'
											: 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
									)}
									onclick={() => toggleExpanded(item.title)}
									aria-expanded={isExpanded(item)}
								>
									<item.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
									<span class="flex-1 truncate text-left">{item.title}</span>
									<ChevronDown
										class={cn(
											'h-4 w-4 shrink-0 transition-transform',
											isExpanded(item) ? 'rotate-180' : ''
										)}
										aria-hidden="true"
									/>
								</button>
								{#if isExpanded(item)}
									<ul class="mt-0.5 space-y-0.5 pl-5" role="list">
										{#each item.children as child (child.href)}
											<li class="relative">
												{#if isActive(child.href)}
													<span
														class="sidebar-active-indicator absolute left-0 inset-y-1 w-0.5 rounded-r-full bg-primary"
													></span>
												{/if}
												<a
													href={resolve(...([child.href] as Parameters<typeof resolve>))}
													class={cn(
														'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
														isActive(child.href)
															? 'bg-sidebar-accent text-sidebar-accent-foreground'
															: 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
													)}
													aria-current={isActive(child.href) ? 'page' : undefined}
												>
													<child.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
													<span class="flex-1 truncate">{child.title}</span>
													{#if child.badge}
														<span
															class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground"
														>
															{child.badge}
														</span>
													{/if}
												</a>
											</li>
										{/each}
									</ul>
								{/if}
							{:else}
								{#if isActive(item.href)}
									<span
										class="sidebar-active-indicator absolute left-0 inset-y-1 w-0.5 rounded-r-full bg-primary"
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
											class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground"
										>
											{item.badge}
										</span>
									{/if}
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>

	<!-- Profile card -->
	<ProfileCard />
</aside>
