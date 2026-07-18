<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createUrlPagination, Search } from '$lib/components/reusable';
	import { RoleCard } from '$lib/components/role-management';
	import type { RoleItem } from '$lib/stores/role-management/role-management';
	import { Plus, X } from '$lib/assets/icons';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { debounce } from '$lib/utils/debounce';

	const pagination = createUrlPagination();
	const activeFilters = $derived([
		...(pagination.search ? [{ key: 'search', label: `Search: "${pagination.search}"` }] : [])
	]);
	const hasActiveFilters = $derived(activeFilters.length > 0);

	// searchInput is derived from the URL so back/forward navigation restores it.
	// It can also be overridden locally for immediate keystroke feedback.
	let searchInput = $derived(pagination.search);

	let roles = $state<RoleItem[]>([]);
	let hasMore = $state(true);
	let loading = $state(false);
	let selectedId = $state<number | null>(null);
	let sentinel = $state<HTMLDivElement | null>(null);

	async function loadRoles(reset = false, q = '') {
		if (loading || (!hasMore && !reset)) return;
		loading = true;
		const params = new URLSearchParams({ q });

		try {
			const res = await fetch(`/api/roles?${params}`);
			const data: { items: RoleItem[] } = await res.json();

			roles = reset ? data.items : [...roles, ...data.items];
		} finally {
			loading = false;
		}
	}

	// Reload whenever the URL search param changes (covers initial load,
	// debounced typing, and back/forward navigation).
	$effect(() => {
		const q = pagination.search;
		hasMore = true;
		loadRoles(true, q);
	});

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		searchInput = value;
		debouncedSearch(value);
	}

	function removeFilter(key: string) {
		if (key === 'search') pagination.setSearch('');
	}

	function clearFilters() {
		pagination.clearAllFilters();
	}

	function selectRole(role: RoleItem) {
		selectedId = role.roleId;
		goto(resolve('/management/role-management/view-role/[id]', { id: String(role.roleId) }), {
			state: { description: role.description }
		});
	}

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !loading && hasMore) {
					loadRoles(false, pagination.search);
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-2xl font-bold text-foreground">Roles & Permissions</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage roles, permissions, and user assignments across your organization.
		</p>
	</div>

	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<Search
			value={searchInput}
			oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
			placeholder="Search roles..."
			variant="bordered"
			class="max-w-sm flex-1"
		/>
	</div>

	{#if hasActiveFilters}
		<div class="flex flex-wrap items-center gap-2">
			{#each activeFilters as filter (filter.key)}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-white/10 dark:text-gray-400"
				>
					{filter.label}
					<button
						type="button"
						onclick={() => removeFilter(filter.key)}
						class="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
						aria-label="Remove {filter.label} filter"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}
			<button
				type="button"
				onclick={clearFilters}
				class="text-xs text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<!-- Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Create New Role card -->
		<button
			class="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-6 transition-all duration-200 border-primary/60 hover:bg-primary/5 shadow"
			onclick={() => {
				roleFormStore.reset();
				goto(resolve('/management/role-management/create-role'));
			}}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border border-dashed shadow transition-colors border-primary/40 bg-primary/10"
			>
				<Plus class="h-5 w-5 transition-colors text-primary" />
			</div>
			<span class="text-sm font-medium transition-colors text-foreground"> Create New Role </span>
		</button>

		<!-- Role cards -->
		{#each roles as role (role.roleId)}
			<RoleCard {role} selected={selectedId === role.roleId} onclick={() => selectRole(role)} />
		{/each}
	</div>

	<!-- Loading skeletons -->
	<!-- {#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [0, 1, 2] as i (i)}
				<div class="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
					<div class="flex items-start justify-between">
						<div class="h-10 w-10 animate-pulse rounded-lg bg-muted"></div>
						<div class="h-4 w-14 animate-pulse rounded-full bg-muted"></div>
					</div>
					<div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
					<div class="space-y-1.5">
						<div class="h-3 w-full animate-pulse rounded bg-muted"></div>
						<div class="h-3 w-3/4 animate-pulse rounded bg-muted"></div>
					</div>
					<div class="mt-2 border-t border-border pt-3">
						<div class="h-3 w-24 animate-pulse rounded bg-muted"></div>
					</div>
				</div>
			{/each}
		</div>
	{/if} -->

	<!-- No results
	{#if !loading && roles.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">
			No roles found matching "{searchInput}".
		</div>
	{/if} -->

	<!-- Infinite scroll sentinel -->
	<div bind:this={sentinel} class="h-1"></div>
</div>
