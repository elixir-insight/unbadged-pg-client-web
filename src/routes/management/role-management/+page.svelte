<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createUrlPagination, Search } from '$lib/components/reusable';
	import { RoleCard, RoleCardSkeleton } from '$lib/components/role-management';
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
	let loading = $state(true);
	let selectedId = $state<number | null>(null);
	let sentinel = $state<HTMLDivElement | null>(null);

	async function loadRoles(reset = false, q = '') {
		if (!reset && (loading || !hasMore)) return;
		loading = true;
		const params = new URLSearchParams({ q, portal: 'management' });

		try {
			const res = await fetch(`/api/roles?${params}`);
			const data: { items?: RoleItem[] } = await res.json();

			// Single-shot list for now — BFF returns the filtered page; appending the same
			// response would duplicate cards and loop while the sentinel stays visible.
			roles = data?.items ?? [];
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	// Reload whenever the URL search param changes (covers initial load,
	// debounced typing, and back/forward navigation).
	$effect(() => {
		const q = pagination.search;
		hasMore = true;
		roles = [];
		loading = true;
		void loadRoles(true, q);
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
		goto(resolve('/management/role-management/view-role/[id]', { id: String(role.roleId) }));
	}

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !loading && hasMore) {
					void loadRoles(false, pagination.search);
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
					class="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
				>
					{filter.label}
					<button
						type="button"
						onclick={() => removeFilter(filter.key)}
						class="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Remove {filter.label} filter"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}
			<button
				type="button"
				onclick={clearFilters}
				class="text-xs text-primary underline-offset-2 hover:underline"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<!-- Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Create New Role card -->
		<button
			type="button"
			class="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-card p-6 shadow transition-all duration-200 hover:bg-primary/5"
			onclick={() => {
				roleFormStore.reset();
				goto(resolve('/management/role-management/create-role'));
			}}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/10 shadow transition-colors"
			>
				<Plus class="h-5 w-5 text-primary transition-colors" />
			</div>
			<span class="text-sm font-medium text-foreground transition-colors">Create New Role</span>
		</button>

		{#if loading && roles.length === 0}
			<RoleCardSkeleton count={5} />
		{:else}
			{#each roles as role (role.roleId)}
				<RoleCard {role} selected={selectedId === role.roleId} onclick={() => selectRole(role)} />
			{/each}
			{#if loading}
				<RoleCardSkeleton count={3} />
			{/if}
		{/if}
	</div>

	{#if !loading && roles.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">
			{#if searchInput}
				No roles found matching "{searchInput}".
			{:else}
				No roles found.
			{/if}
		</div>
	{/if}

	<!-- Infinite scroll sentinel -->
	<div bind:this={sentinel} class="h-1"></div>
</div>
