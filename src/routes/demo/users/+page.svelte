<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { createUrlPagination } from '$lib/components/reusable/pagination/use-url-pagination.svelte.js';
	import { Search } from '$lib/components/reusable';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import { Chip as Badge } from '$lib/components/reusable';
	let { data } = $props();

	type User = {
		id: string;
		firstName: string;
		email: string;
		role: string;
		status: 'active' | 'inactive' | 'pending';
	};

	// URL-driven pagination — total comes from the API; skip/limit are applied server-side.
	const pagination = createUrlPagination({ total: () => data.data.total });

	// Search is server-side (+page.server.ts); list pagination uses skip only when not searching.
	let pageUsers = $derived(data.data.users);

	const columns: ColumnDef<User>[] = [
		{ accessorKey: 'firstName', header: 'firstName', enableSorting: true },
		{ accessorKey: 'email', header: 'Email' },
		{ accessorKey: 'role', header: 'Role', enableSorting: true }
	];

	// Local search input — kept in sync with URL so back/forward navigation
	// restores the input value without an extra round-trip.
	let searchInput = $derived(pagination.search);

	$effect(() => {
		searchInput = pagination.search;
	});

	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleSearchInput(value: string) {
		searchInput = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => pagination.setSearch(value), 300);
	}
</script>

<div class="space-y-5 p-10">
	<div>
		<h1 class="text-2xl font-semibold">Users</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			All state is driven by the URL — share, bookmark, or reload any view.
		</p>
	</div>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-3">
		<Search
			value={searchInput}
			oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
			placeholder="Search by firstName or email…"
			variant="bordered"
			class="w-full sm:w-72"
		/>
		{#if pagination.search || pagination.status}
			<button
				class="text-xs text-muted-foreground underline-offset-2 hover:underline"
				onclick={() => {
					pagination.setSearch('');
					pagination.setStatus('');
				}}
			>
				Clear filters
			</button>
		{/if}

		<div class="ml-auto flex items-center gap-1.5">
			{#if pagination.status}
				<Badge variant="secondary" class="capitalize">{pagination.status}</Badge>
			{/if}
			<span class="text-xs text-muted-foreground/60">
				{data.data.total} user{data.data.total === 1 ? '' : 's'}
			</span>
		</div>
	</div>

	<!-- URL debug strip (dev aid — remove in production) -->
	<div
		class="rounded-md border border-dashed border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground/60 font-mono"
	>
		skip={pagination.search ? 0 : pagination.skip} &nbsp; limit={pagination.limit} &nbsp; page={pagination.search
			? 1
			: pagination.currentPage}/{pagination.search ? 1 : pagination.pageCount}
		{#if pagination.search}&nbsp; search="{pagination.search}"{/if}
		{#if pagination.status}&nbsp; status={pagination.status}{/if}
	</div>

	<Table
		data={pageUsers}
		{columns}
		pageNumber={pagination.search ? 1 : pagination.currentPage}
		totalPages={pagination.search ? 1 : pagination.pageCount}
		showingText={pagination.showingText}
		setPageNumber={pagination.setPage}
		caption="User Table"
	/>
</div>
