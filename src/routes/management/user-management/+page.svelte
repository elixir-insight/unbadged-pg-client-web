<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createUrlPagination, Dropdown, Search } from '$lib/components/reusable';
	import { UserCard } from '$lib/components/user-management';
	import { Plus, X } from '$lib/assets/icons';
	import { userFormStore } from '$lib/stores/user-form.svelte';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { getUniqueRoles } from '$lib/stores/user-management/user-mapper';
	import { fetchUsers } from '$lib/stores/user-management/users-api';
	import type { UserItem } from '$lib/stores/user-management/user-management';
	import { debounce } from '$lib/utils/debounce';

	const PAGE_SIZE = 10;
	const pagination = createUrlPagination({ defaultLimit: PAGE_SIZE });

	const statusOptions = [
		{ value: 'Active', label: 'Active' },
		{ value: 'Invited', label: 'Invited' }
	];

	let users = $state<UserItem[]>([]);
	let availableRoles = $state<string[]>([]);
	let loading = $state(false);
	let hasMore = $state(true);
	let nextPage = $state(1);
	let total = $state(0);
	let loadError = $state<string | null>(null);
	let selectedId = $state<string | null>(null);
	let sentinel = $state<HTMLDivElement | null>(null);
	let sentinelVisible = $state(false);
	let requestSeq = 0;

	const searchInput = $derived(pagination.search);
	const statusFilter = $derived(pagination.status);
	const roleFilter = $derived(pagination.role);

	const roleOptions = $derived(
		availableRoles.map((role) => ({
			value: role,
			label: role
		}))
	);

	const activeFilters = $derived([
		...(pagination.status
			? [
					{
						key: 'status',
						label: `Status: ${statusOptions.find((option) => option.value === pagination.status)?.label ?? pagination.status}`
					}
				]
			: []),
		...(pagination.role
			? [
					{
						key: 'role',
						label: `Role: ${roleOptions.find((option) => option.value === pagination.role)?.label ?? pagination.role}`
					}
				]
			: []),
		...(pagination.search ? [{ key: 'search', label: `Search: "${pagination.search}"` }] : [])
	]);

	const hasActiveFilters = $derived(activeFilters.length > 0);

	async function loadUsers(
		reset: boolean,
		filters?: { search: string; status: string; role: string }
	) {
		// Appends wait for an in-flight request; resets always start and invalidate older ones.
		if (!reset && (loading || !hasMore)) return;

		const pageToLoad = reset ? 1 : nextPage;
		const search = filters?.search ?? pagination.search;
		const status = filters?.status ?? pagination.status;
		const role = filters?.role ?? pagination.role;
		const hasFilters = Boolean(search || status || role);
		// Filters force a large upstream fetch in the BFF — load once instead of
		// re-fetching ~1000 members on every infinite-scroll page.
		const limit = hasFilters ? 1000 : PAGE_SIZE;
		const seq = ++requestSeq;

		loading = true;
		loadError = null;

		try {
			const data = await fetchUsers({
				search,
				status,
				role,
				page: pageToLoad,
				limit
			});

			// Ignore stale responses from an older filter/search request.
			if (seq !== requestSeq) return;

			total = data.meta.total;

			if (reset) {
				users = data.items;
			} else {
				const seen = new Set(users.map((user) => user.id));
				const fresh = data.items.filter((user) => !seen.has(user.id));
				// Stop infinite-scroll if the API keeps returning the same page/duplicates.
				if (fresh.length === 0) {
					hasMore = false;
					return;
				}
				users = [...users, ...fresh];
			}

			availableRoles = getUniqueRoles(users);
			nextPage = pageToLoad + 1;
			hasMore = hasFilters
				? false
				: data.items.length > 0 &&
					(data.meta.total > 0 ? users.length < data.meta.total : data.items.length === PAGE_SIZE);
		} catch (e) {
			if (seq !== requestSeq) return;
			loadError = e instanceof Error ? e.message : 'Failed to load users';
			hasMore = false;
		} finally {
			if (seq === requestSeq) loading = false;
		}
	}

	// Reset list whenever filters change (including initial load).
	$effect(() => {
		const search = pagination.search;
		const status = pagination.status;
		const role = pagination.role;

		hasMore = true;
		nextPage = 1;
		void loadUsers(true, { search, status, role });
	});

	// Observe the sentinel against the AppShell scroll container (not the window).
	$effect(() => {
		if (!sentinel) return;

		const root = sentinel.closest('.app-shell-content');
		const observer = new IntersectionObserver(
			(entries) => {
				sentinelVisible = entries[0]?.isIntersecting ?? false;
			},
			{ root, rootMargin: '240px' }
		);

		observer.observe(sentinel);
		return () => {
			observer.disconnect();
			sentinelVisible = false;
		};
	});

	// React to visibility + loading/hasMore without stale closures.
	$effect(() => {
		if (sentinelVisible && hasMore && !loading) {
			void loadUsers(false);
		}
	});

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	function removeFilter(key: string) {
		if (key === 'status') pagination.setStatus('');
		else if (key === 'role') pagination.setRole('');
		else if (key === 'search') pagination.setSearch('');
	}

	function clearFilters() {
		pagination.clearAllFilters();
	}

	function selectUser(user: UserItem) {
		selectedId = user.id;
		userFormStore.setViewUser(user);
		goto(resolve('/management/user-management/view-user/[id]', { id: user.id }));
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">User management</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage user accounts, roles, and access across your organization.
		</p>
	</div>

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<Search
			value={searchInput}
			oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
			placeholder="Search by User Name / Employee ID"
			variant="bordered"
			class="max-w-sm flex-1"
		/>

		<Dropdown
			value={statusFilter}
			onValueChange={(value) => pagination.setStatus(value)}
			options={statusOptions}
			placeholder="Status"
			bordered
			class="w-full sm:w-44"
		/>

		<Dropdown
			value={roleFilter}
			onValueChange={(value) => pagination.setRole(value)}
			options={roleOptions}
			placeholder="Role"
			bordered
			search
			class="w-full sm:w-64"
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
		<button
			class="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-card p-6 shadow transition-all duration-200 hover:bg-primary/5"
			onclick={() => {
				userFormStore.reset();
				createUserFormStore.reset();
				goto(resolve('/management/user-management/create-user'));
			}}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/10 shadow transition-colors"
			>
				<Plus class="h-5 w-5 text-primary transition-colors" />
			</div>
			<span class="text-sm font-medium text-foreground transition-colors">Add user</span>
		</button>

		{#each users as user (user.id)}
			<UserCard {user} selected={selectedId === user.id} onclick={() => selectUser(user)} />
		{/each}
	</div>

	{#if loading && users.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">Loading users…</p>
	{:else if !loading && users.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">
			{#if loadError}
				{loadError}
			{:else}
				No users found
				{#if searchInput || statusFilter || roleFilter}
					matching your filters.
				{:else}
					.
				{/if}
			{/if}
		</div>
	{:else if loading}
		<p class="py-4 text-center text-sm text-muted-foreground">Loading more users…</p>
	{:else if !hasMore && users.length > 0}
		<p class="py-4 text-center text-sm text-muted-foreground">
			Showing all {total || users.length} users
		</p>
	{/if}

	{#if hasMore}
		<div bind:this={sentinel} class="h-4 w-full" aria-hidden="true"></div>
	{/if}
</div>
