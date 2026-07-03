<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { navigating, page as pageState } from '$app/state';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import { Chip, Button, Search, FilterCards, createUrlPagination } from '$lib/components/reusable';
	import type { ReferralMerchant, ReferralStatus } from './types';
	import { debounce } from '$lib/utils/debounce.js';

	let { data } = $props();

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});
	const dateFormatter = new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	function formatDate(value: string) {
		return dateFormatter.format(new Date(value));
	}

	const statusChipVariant = {
		active: 'success',
		pending: 'warning',
		inactive: 'secondary',
		rejected: 'destructive'
	} as const;

	const statusChipLabel = {
		active: 'Active',
		pending: 'Pending',
		inactive: 'Inactive',
		rejected: 'Rejected'
	} as const;

	const filterLabelToStatus: Record<string, string> = {
		All: '',
		Active: 'active',
		Pending: 'pending',
		Inactive: 'inactive',
		Rejected: 'rejected'
	};

	const statusToFilterLabel: Record<string, string> = {
		'': 'All',
		active: 'Active',
		pending: 'Pending',
		inactive: 'Inactive',
		rejected: 'Rejected'
	};

	const pagination = createUrlPagination({
		defaultLimit: 8,
		total: () => data.referrals.total
	});

	const pageRows = $derived(
		data.referrals.merchants.slice(pagination.skip, pagination.skip + pagination.limit)
	);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const filterCards = $derived([
		{ label: 'All', count: data.referrals.statusCounts.all },
		{ label: 'Active', count: data.referrals.statusCounts.active },
		{ label: 'Pending', count: data.referrals.statusCounts.pending },
		{ label: 'Inactive', count: data.referrals.statusCounts.inactive },
		{ label: 'Rejected', count: data.referrals.statusCounts.rejected }
	]);

	let searchInput = $derived(pagination.search);

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		searchInput = value;
		debouncedSearch(value);
	}

	function handleFilterSelect(label: string) {
		pagination.setStatus(filterLabelToStatus[label] ?? '');
	}

	function clearFilters() {
		searchInput = '';
		pagination.setSearch('');
		pagination.setStatus('');
	}

	const hasActiveFilters = $derived(Boolean(pagination.search || pagination.status));

	const columns: ColumnDef<ReferralMerchant>[] = [
		{
			accessorKey: 'name',
			header: 'Merchant',
			cell: (info) => renderSnippet(merchantCell, info.row.original)
		},
		{ accessorKey: 'merchantId', header: 'Merchant ID' },
		{ accessorKey: 'email', header: 'Email' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderSnippet(statusCell, { status: info.getValue<ReferralStatus>() })
		},
		{
			accessorKey: 'referredOn',
			header: 'Referred On',
			cell: (info) => formatDate(info.getValue<string>())
		},
		{
			accessorKey: 'volume',
			header: () => renderSnippet(amountHeader, { label: 'Volume' }),
			meta: { align: 'right' },
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		},
		{
			accessorKey: 'commissionEarned',
			header: () => renderSnippet(amountHeader, { label: 'Commission' }),
			meta: { align: 'right' },
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		}
	];
</script>

{#snippet merchantCell(merchant: ReferralMerchant)}
	<div class="flex min-w-0 items-center gap-2.5">
		<span
			class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary"
		>
			{merchant.name
				.split(' ')
				.map((word) => word[0])
				.slice(0, 2)
				.join('')
				.toUpperCase()}
		</span>
		<span class="min-w-0 truncate font-medium text-foreground">{merchant.name}</span>
	</div>
{/snippet}

{#snippet amountCell({ value }: { value: string })}
	<span class="block truncate font-mono tabular-nums" title={value}>{value}</span>
{/snippet}

{#snippet amountHeader({ label }: { label: string })}
	<span class="block truncate">{label}</span>
{/snippet}

{#snippet statusCell({ status }: { status: ReferralStatus })}
	<Chip variant={statusChipVariant[status]}>{statusChipLabel[status]}</Chip>
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Referrals</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Merchants you referred and the commission earned from each.
		</p>
	</div>

	<FilterCards
		cards={filterCards}
		selected={statusToFilterLabel[pagination.status] ?? 'All'}
		loading={isLoading}
		onselect={handleFilterSelect}
		class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
	/>

	<div class="flex flex-wrap items-end gap-3">
		<div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm">
			<span class="text-xs font-medium text-muted-foreground">Search</span>
			<Search
				value={searchInput}
				oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
				placeholder="Search by name, ID, or email…"
				variant="bordered"
				class="w-full"
			/>
		</div>

		{#if hasActiveFilters}
			<Button size="sm" variant="ghost" onclick={clearFilters}>Clear filters</Button>
		{/if}
	</div>

	<div class="rounded-lg border border-border bg-card shadow-2xl">
		{#if !isLoading && data.referrals.total === 0}
			<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
				<div
					class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10"
				>
					<svg
						class="size-5 text-muted-foreground/25"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-foreground">No referrals found</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{#if hasActiveFilters}
							Try adjusting your search or status filter.
						{:else}
							Referred merchants will appear here once onboarding begins.
						{/if}
					</p>
				</div>
				{#if hasActiveFilters}
					<Button size="sm" variant="outline" onclick={clearFilters}>Clear filters</Button>
				{/if}
			</div>
		{:else}
			<Table
				data={pageRows}
				{columns}
				pageNumber={pagination.currentPage}
				setPageNumber={pagination.setPage}
				totalPages={pagination.pageCount}
				variant="borderless"
				loading={isLoading}
			/>
		{/if}
	</div>
</div>
