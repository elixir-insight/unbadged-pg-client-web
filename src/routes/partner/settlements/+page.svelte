<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ColumnDef } from '@tanstack/table-core';
	import { navigating, page as pageState } from '$app/state';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import { Button, Search, StatCard, createUrlPagination } from '$lib/components/reusable';
	import type { StatCardTone } from '$lib/components/reusable';
	import type { PartnerMerchantSummary } from './types';
	import { formatInr, formatRecordDate } from './[merchantId]/shared';
	import PartnerSettlementStatusBadge from './[merchantId]/partner-settlement-status-badge.svelte';
	import { debounce } from '$lib/utils/debounce.js';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const hasLoadError = $derived(Boolean(data.loadError));
	const settlements = $derived(data.settlements);

	const pagination = createUrlPagination({
		defaultLimit: 8,
		total: () => settlements?.total ?? 0
	});

	const pageRows = $derived(
		settlements
			? settlements.merchants.slice(pagination.skip, pagination.skip + pagination.limit)
			: []
	);

	let searchInput = $derived(pagination.search);

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		searchInput = value;
		debouncedSearch(value);
	}

	function clearSearch() {
		searchInput = '';
		pagination.setSearch('');
	}

	function retryLoad() {
		goto(resolve('/partner/settlements'), { invalidateAll: true });
	}

	function openMerchant(merchant: PartnerMerchantSummary) {
		goto(resolve('/partner/settlements/[merchantId]', { merchantId: merchant.id }));
	}

	const statCards = $derived<
		{
			label: string;
			value: string;
			badgeText: string;
			badgeVariant: StatCardTone;
			subText: string;
		}[]
	>(
		settlements
			? [
					{
						label: 'Total Commission',
						value: currency.format(settlements.summary.totalCommission),
						badgeText: 'EARNED',
						badgeVariant: 'brand',
						subText: `${settlements.total} merchants`
					},
					{
						label: 'Total Settled',
						value: currency.format(settlements.summary.totalSettled),
						badgeText: 'PAID',
						badgeVariant: 'success',
						subText: 'Across all merchants'
					},
					{
						label: 'Pending',
						value: currency.format(settlements.summary.pendingAmount),
						badgeText: 'DUE',
						badgeVariant: 'warning',
						subText: `${settlements.summary.unsettledCount} unsettled`
					},
					{
						label: 'Merchants',
						value: String(settlements.total),
						badgeText: 'ACTIVE',
						badgeVariant: 'brand',
						subText: 'Referred merchant accounts'
					}
				]
			: []
	);

	const columns: ColumnDef<PartnerMerchantSummary>[] = [
		{
			accessorKey: 'name',
			header: 'Merchant',
			cell: (info) => renderSnippet(merchantCell, info.row.original)
		},
		{ accessorKey: 'id', header: 'Merchant ID' },
		{ accessorKey: 'city', header: 'City' },
		{
			accessorKey: 'commissionEarned',
			header: () => renderSnippet(amountHeader, { label: 'Commission' }),
			cell: (info) => renderSnippet(amountCell, { value: formatInr(info.getValue<number>()) })
		},
		{
			accessorKey: 'totalSettled',
			header: () => renderSnippet(amountHeader, { label: 'Settled' }),
			cell: (info) => renderSnippet(amountCell, { value: formatInr(info.getValue<number>()) })
		},

		{
			accessorKey: 'lastSettlementDate',
			header: 'Last settlement',
			cell: (info) => {
				const value = info.getValue<string | null>();
				return value ? formatRecordDate(value) : '—';
			}
		},
		{
			accessorKey: 'pendingAmount',
			header: () => renderSnippet(amountHeader, { label: 'Pending' }),
			cell: (info) => renderSnippet(amountCell, { value: formatInr(info.getValue<number>()) })
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderSnippet(statusCell, { merchant: info.row.original })
		}
	];
</script>

{#snippet merchantCell(merchant: PartnerMerchantSummary)}
	<div class="flex items-center gap-2.5">
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
		<span class="font-medium text-foreground">{merchant.name}</span>
	</div>
{/snippet}

{#snippet amountCell({ value }: { value: string })}
	<div class="block w-full text-right font-mono tabular-nums">{value}</div>
{/snippet}

{#snippet amountHeader({ label }: { label: string })}
	<span class="ml-auto">{label}</span>
{/snippet}

{#snippet statusCell({ merchant }: { merchant: PartnerMerchantSummary })}
	<PartnerSettlementStatusBadge status={merchant.status} />
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Settlements</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Track commission settlements across your referred merchants.
		</p>
	</div>

	{#if hasLoadError}
		<div
			class="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center"
			role="alert"
		>
			<p class="text-sm font-medium text-foreground">{data.loadError}</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Check your connection and try loading the merchant list again.
			</p>
			<Button class="mt-4" size="sm" onclick={retryLoad}>Retry</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each statCards as card (card.label)}
				<StatCard
					label={card.label}
					value={card.value}
					badgeText={card.badgeText}
					badgeVariant={card.badgeVariant}
					subText={card.subText}
				/>
			{/each}
		</div>

		<div class="flex flex-wrap items-end gap-3">
			<div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm">
				<span class="text-xs font-medium text-muted-foreground">Search</span>
				<Search
					value={searchInput}
					oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
					placeholder="Search by merchant, ID, or city…"
					variant="bordered"
					class="w-full"
				/>
			</div>

			{#if pagination.search}
				<Button size="sm" variant="ghost" onclick={clearSearch}>Clear search</Button>
			{/if}
		</div>

		<div class="rounded-lg border border-border bg-card shadow-2xl">
			{#if !isLoading && settlements && settlements.total === 0}
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
						<p class="text-sm font-medium text-foreground">No merchants found</p>
						<p class="mt-1 text-sm text-muted-foreground">
							{#if pagination.search}
								Try a different search term.
							{:else}
								Referred merchants with settlement activity will appear here.
							{/if}
						</p>
					</div>
					{#if pagination.search}
						<Button size="sm" variant="outline" onclick={clearSearch}>Clear search</Button>
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
					onRowClick={openMerchant}
				/>
			{/if}
		</div>
	{/if}
</div>
