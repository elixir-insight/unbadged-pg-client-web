<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createUrlPagination, Search } from '$lib/components/reusable';
	import { RoleCard } from '$lib/components/role-management';
	import type { RoleItem } from '$lib/stores/role-management/role-management';
	import { X } from '$lib/assets/icons';
	import { debounce } from '$lib/utils/debounce';

	const pagination = createUrlPagination();
	const activeFilters = $derived([
		...(pagination.search ? [{ key: 'search', label: `Search: "${pagination.search}"` }] : [])
	]);
	const hasActiveFilters = $derived(activeFilters.length > 0);

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
		goto(resolve('/merchant/role-management/view-role/[id]', { id: String(role.roleId) }), {
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
	<div>
		<h1 class="text-2xl font-bold text-foreground">Roles & Permissions</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage roles, permissions, and user assignments across your organization.
		</p>
	</div>

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

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each roles as role (role.roleId)}
			<RoleCard {role} selected={selectedId === role.roleId} onclick={() => selectRole(role)} />
		{/each}
	</div>

	<div bind:this={sentinel} class="h-1"></div>
</div>
