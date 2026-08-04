<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { createRawSnippet } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Chip, Dropdown, Search, Table, createUrlPagination } from '$lib/components/reusable';
	import { debounce } from '$lib/utils/debounce.js';
	import { X } from '$lib/assets/icons';
	import {
		INSIGHTS_STATUS_LABEL,
		INSIGHTS_STATUS_OPTIONS,
		INSIGHTS_STATUS_VARIANT
	} from './status';
	import type { InsightsMerchant, InsightsMerchantStatus } from './types';

	interface Props {
		merchants: InsightsMerchant[];
		detailPath: (merchantId: string) => ResolvedPathname;
	}

	let { merchants, detailPath }: Props = $props();

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'frozen', label: 'Frozen' },
		{ value: 'hold', label: 'Hold' }
	];

	const pagination = createUrlPagination({
		defaultLimit: 5,
		total: () => filteredMerchants.length
	});

	const searchInput = $derived(pagination.search);
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	const filteredMerchants = $derived.by(() => {
		const query = pagination.search.trim().toLowerCase();
		const status = pagination.status as InsightsMerchantStatus | '';

		return merchants.filter((merchant) => {
			const matchesStatus = !status || merchant.status === status;
			const matchesSearch = !query || merchant.name.toLowerCase().includes(query);
			return matchesStatus && matchesSearch;
		});
	});

	const pageMerchants = $derived(
		filteredMerchants.slice(pagination.skip, pagination.skip + pagination.limit)
	);

	const activeFilters = $derived.by(() => {
		const filters: { key: 'status' | 'search'; label: string }[] = [];

		if (pagination.status) {
			const option = INSIGHTS_STATUS_OPTIONS.find((item) => item.value === pagination.status);
			filters.push({
				key: 'status',
				label: `Status: ${option?.label ?? pagination.status}`
			});
		}

		if (pagination.search) {
			filters.push({ key: 'search', label: `Merchant: ${pagination.search}` });
		}

		return filters;
	});

	const hasActiveFilters = $derived(activeFilters.length > 0);

	function removeFilter(key: 'status' | 'search') {
		if (key === 'status') pagination.setStatus('');
		else pagination.setSearch('');
	}

	function clearFilters() {
		pagination.clearAllFilters();
	}

	function openMerchant(merchant: InsightsMerchant) {
		goto(detailPath(merchant.id));
	}

	const columns: ColumnDef<InsightsMerchant>[] = [
		{
			accessorKey: 'name',
			header: 'Merchant Name'
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status;
				const variant = INSIGHTS_STATUS_VARIANT[status] ?? 'secondary';
				const children = createRawSnippet(() => ({
					render: () => INSIGHTS_STATUS_LABEL[status]
				}));
				return renderComponent(Chip, { variant, children });
			}
		}
	];
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold text-foreground">Transaction Insights</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Review merchant activity status and open the monthly transaction calendar.
		</p>
	</div>

	<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
		<div class="w-full sm:max-w-sm sm:flex-1">
			<Search
				value={searchInput}
				oninput={(event) => handleSearchInput((event.currentTarget as HTMLInputElement).value)}
				placeholder="Search by Merchant"
			/>
		</div>
		<Dropdown
			options={statusOptions}
			value={pagination.status || undefined}
			placeholder="Status"
			class="w-full sm:w-40"
			onValueChange={(value) => pagination.setStatus(value)}
		/>
	</div>

	{#if hasActiveFilters}
		<div class="flex flex-wrap items-center gap-2">
			{#each activeFilters as filter (filter.key)}
				<Chip variant="outline" class="h-auto gap-1.5 rounded-full px-3 py-1 text-xs">
					<span class="text-muted-foreground">{filter.label}</span>
					<button
						type="button"
						onclick={() => removeFilter(filter.key)}
						aria-label="Remove {filter.label} filter"
						class="ml-0.5 cursor-pointer rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none"
					>
						<X class="size-3" />
					</button>
				</Chip>
			{/each}
			<button
				type="button"
				onclick={clearFilters}
				class="text-xs font-medium text-primary hover:underline focus-visible:outline-none"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<div class="surface-card rounded-lg border pb-4 shadow-sm">
		<div class="flex items-center justify-between gap-2 p-4">
			<p class="text-xs text-muted-foreground">{pagination.showingText}</p>
		</div>
		<Table
			data={pageMerchants}
			{columns}
			variant="default"
			pageNumber={pagination.currentPage}
			totalPages={pagination.pageCount}
			setPageNumber={pagination.setPage}
			onRowClick={openMerchant}
		/>
	</div>
</div>
