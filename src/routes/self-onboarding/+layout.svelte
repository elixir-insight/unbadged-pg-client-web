<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import { ProfileCard } from '$lib/components/reusable';
	import { ClipboardCheck, CompanyLogoLight, Menu, X } from '$lib/assets/icons';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { formatUserType, getUserInitials } from '$lib/stores/auth/display';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();

	let isMobileOpen = $state(false);

	onMount(() => {
		theme.init();
	});

	const session = $derived(merchantSession.session);
	const userName = $derived(session?.merchantName ?? 'User');
	const profileProps = $derived(
		session
			? {
					userName,
					userRole: formatUserType(session.userType ?? ''),
					userInitials: getUserInitials(userName),
					vanNumber: session.displayOrgId,
					confirmLogout: true
				}
			: null
	);
</script>

<div class="flex h-screen overflow-hidden bg-background">
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
		<div
			class="mt-4 flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3"
		>
			<a
				href={resolve('/self-onboarding')}
				aria-label="Go to self onboarding"
				class="flex min-w-0 items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<CompanyLogoLight class="shrink-0" />
			</a>

			<button
				class="relative flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
				onclick={() => (isMobileOpen = false)}
				aria-label="Close navigation"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<nav class="flex-1 overflow-y-auto px-2 py-6" aria-label="Self onboarding">
			<div>
				<p class="mb-1 px-2 text-xs tracking-wider text-muted-foreground">Overview</p>
				<ul class="space-y-0.5" role="list">
					<li class="relative">
						<span
							class="sidebar-active-indicator absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-primary"
						></span>
						<a
							href={resolve('/self-onboarding')}
							class="flex items-center gap-2.5 rounded-md bg-sidebar-accent px-2 py-1.5 text-sm font-medium text-sidebar-accent-foreground"
							aria-current="page"
						>
							<ClipboardCheck class="h-4 w-4 shrink-0" aria-hidden="true" />
							<span class="flex-1 truncate">Onboarding</span>
						</a>
					</li>
				</ul>
			</div>
		</nav>

		{#if profileProps}
			<ProfileCard {...profileProps} />
		{/if}
	</aside>

	<main
		class="flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden bg-background md:bg-muted md:p-4"
	>
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl md:shadow-sm md:ring-1 md:ring-border"
		>
			<header class="flex h-14 shrink-0 items-center gap-3 px-4">
				<button
					class="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-accent hover:text-accent-foreground md:hidden"
					onclick={() => (isMobileOpen = true)}
					aria-label="Open navigation"
				>
					<Menu class="h-4 w-4" />
				</button>
				<p class="min-w-0 truncate text-sm text-muted-foreground">
					Welcome, <span class="font-bold text-foreground">{userName}</span>
				</p>
			</header>

			<div class="app-shell-content min-h-0 flex-1 overflow-x-clip overflow-y-auto">
				<div class="min-h-full p-5">
					{@render children()}
				</div>
			</div>
		</div>
	</main>
</div>
