<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		Button,
		FilterCards,
		SearchField,
		Tabs,
		createUrlPagination
	} from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
	import { debounce } from '$lib/utils/debounce.js';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { useOrderStats, useSettlementsList } from './use-settlements-list.svelte';
	import SettlementStatusBadge from './settlement-status-badge.svelte';
	import SettlementDatePicker from './settlement-date-picker.svelte';
	import StatePanel from './state-panel.svelte';
	import type { SettlementStatus, SettlementTab } from './types';

	// ── URL-derived filters — date/status/search/tab all live in query params
	// so a refresh or shared link reproduces the exact same view, and the
	// detail page can hand them straight back on "Back". ──────────────────────
	function yesterdayIso(): string {
		return today(getLocalTimeZone()).subtract({ days: 1 }).toString();
	}

	const dateParam = $derived(page.url.searchParams.get('date') ?? yesterdayIso());
	const selectedDate = $derived<DateValue>(parseDate(dateParam));
	const tabParam = $derived<SettlementTab>(
		page.url.searchParams.get('tab') === 'disbursements' ? 'disbursements' : 'collections'
	);

	function updateParams(updates: Record<string, string | null>, replace = true) {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
		const href =
			`${page.url.pathname}?${url.searchParams.toString()}` as `${typeof page.url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: replace, noScroll: true, keepFocus: true });
	}

	function setDate(value: DateValue) {
		updateParams({ date: value.toString(), skip: null });
	}

	function handleTabChange(value: string) {
		updateParams({ tab: value === 'collections' ? null : value, skip: null });
	}

	// ── Data — order-status counts and money totals are fetched separately
	// (orders/transactions service vs. settlement service) so either can be
	// swapped for a real API independently of the other. ───────────────────────
	const list = useSettlementsList(() => dateParam);
	const orderStats = useOrderStats(() => dateParam);

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
	const dateLabel = $derived(dateFormatter.format(selectedDate.toDate(getLocalTimeZone())));

	const pagination = createUrlPagination({ defaultLimit: 8, total: () => filteredData.length });

	let searchInput = $derived(pagination.search);
	$effect(() => {
		searchInput = pagination.search;
	});
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	// ── Order-stat cards — only "Pending" and "Total Orders" have a real
	// settlement-status equivalent, so only those two drive the table's
	// status filter. "Successful"/"Created"/"Failed" are visual-only picks
	// (order status isn't the same thing as settlement status). Selection
	// still mirrors the filter when it's changed elsewhere (dropdown, chip,
	// Clear All), so the two controls never visibly disagree.
	let selectedOrderCard = $state<string>('Total Orders');
	$effect(() => {
		if (pagination.status === 'pending') {
			selectedOrderCard = 'Pending';
		} else if (selectedOrderCard === 'Pending') {
			selectedOrderCard = 'Total Orders';
		}
	});

	function selectOrderCard(label: string) {
		if (label === 'Total Orders') pagination.setStatus('');
		else if (label === 'Pending') pagination.setStatus('pending');
	}

	function removeFilter(key: 'status' | 'search') {
		if (key === 'status') pagination.setStatus('');
		else pagination.setSearch('');
	}

	function clearAllFilters() {
		// A single atomic navigate — calling setStatus() then setSearch()
		// separately would race, since each reads page.url before the other's
		// goto() has resolved and can clobber it.
		pagination.clearAllFilters();
	}

	const activeFilters = $derived.by(() => {
		const filters: { key: 'status' | 'search'; label: string; value: string }[] = [];
		if (pagination.status) {
			const label = pagination.status.charAt(0).toUpperCase() + pagination.status.slice(1);
			filters.push({ key: 'status', label: 'Status', value: label });
		}
		if (pagination.search) {
			filters.push({ key: 'search', label: 'Merchant', value: pagination.search });
		}
		return filters;
	});

	const filteredData = $derived.by(() => {
		let result = list.items;
		if (pagination.status) {
			result = result.filter((r) => r.status === pagination.status);
		}
		if (pagination.search) {
			const query = pagination.search.toLowerCase();
			result = result.filter((r) => r.merchantName.toLowerCase().includes(query));
		}
		return result;
	});

	const pagedData = $derived(
		filteredData.slice(pagination.skip, pagination.skip + pagination.limit)
	);
	const showingText = $derived(`${pagination.showingText} settlements`);

	interface SettlementDisplayRow extends Record<string, unknown> {
		merchantId: string;
		merchantName: string;
		settlementId: string;
		saleAmount: string;
		deductions: string;
		netPayout: string;
		status: SettlementStatus;
	}

	const displayRows = $derived<SettlementDisplayRow[]>(
		pagedData.map((r) => ({
			merchantId: r.merchantId,
			merchantName: r.merchantName,
			settlementId: r.settlementId,
			saleAmount: currency.format(r.saleAmount),
			deductions: currency.format(r.deductions),
			netPayout: currency.format(r.netPayout),
			status: r.status
		}))
	);

	const columns: ColumnDef<SettlementDisplayRow>[] = [
		{ accessorKey: 'merchantName', header: 'Merchant' },
		{ accessorKey: 'settlementId', header: 'Settlement ID' },
		{ accessorKey: 'saleAmount', header: 'Sale Amount', enableSorting: true },
		{ accessorKey: 'deductions', header: 'Deductions' },
		{ accessorKey: 'netPayout', header: 'Net Payout', enableSorting: true },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(SettlementStatusBadge, { status: info.getValue<SettlementStatus>() })
		}
	];

	// The detail page has its own URL-driven pagination for its transaction
	// table (skip/limit/search/status). Forward this list's filter state
	// under a `list_` prefix instead of the bare param names, so the two
	// pages' query params never collide — the detail page's Back button
	// reads these prefixed params back out to restore this view.
	function goToDetail(row: SettlementDisplayRow) {
		const params = new SvelteURLSearchParams();
		params.set('date', dateParam);
		if (pagination.status) params.set('list_status', pagination.status);
		if (pagination.search) params.set('list_search', pagination.search);
		if (pagination.skip) params.set('list_skip', String(pagination.skip));
		if (pagination.limit) params.set('list_limit', String(pagination.limit));
		const detailPath = resolve('/management/settlements/[settlementId]', {
			settlementId: row.settlementId
		});
		const href = `${detailPath}?${params.toString()}` as `${typeof detailPath}?${string}`;
		goto(resolve(href as '/'));
	}

	function rowAriaLabel(row: SettlementDisplayRow): string {
		return `View settlement for ${row.merchantName}, ${row.netPayout} net payout, ${row.status}`;
	}
</script>

{#snippet collectionsTab()}
	<div class="flex flex-col gap-6 pt-4">
		<!-- Order-level summary — internal orders/transactions service.
		     Only "Pending" and "Total Orders" map onto the settlement-status
		     filter below; the rest are visual-only picks (see selectOrderCard). -->
		{#if orderStats.error}
			<StatePanel
				title="Couldn't load order stats"
				description={orderStats.error}
				actionLabel="Retry"
				onAction={orderStats.retry}
			/>
		{:else}
			<FilterCards
				loading={orderStats.loading}
				skeletonCount={5}
				cards={orderStats.stats
					? [
							{ label: 'Total Orders', count: orderStats.stats.orders },
							{ label: 'Successful', count: orderStats.stats.successful },
							{ label: 'Pending', count: orderStats.stats.pending },
							{ label: 'Created', count: orderStats.stats.created },
							{ label: 'Failed', count: orderStats.stats.failed }
						]
					: []}
				bind:selected={selectedOrderCard}
				onselect={selectOrderCard}
				class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
			/>
		{/if}

		<!-- Filter bar -->
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap items-center gap-2">
					<SettlementDatePicker
						value={selectedDate}
						maxValue={today(getLocalTimeZone())}
						onChange={setDate}
					/>
				</div>
				<div class="w-full max-w-xs">
					<SearchField
						fields={[
							{ value: 'merchant', label: 'Merchant', placeholder: 'e.g. Meridian Retail…' }
						]}
						field="merchant"
						value={searchInput}
						onSearch={(_, value) => debouncedSearch(value)}
					/>
				</div>
			</div>

			{#if activeFilters.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					{#each activeFilters as filter (filter.key)}
						<Chip variant="outline" class="h-auto gap-1.5 rounded-full px-3 py-1 text-xs">
							<span class="text-muted-foreground">{filter.label}:</span>
							<span class="font-semibold">{filter.value}</span>
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
						onclick={clearAllFilters}
						class="text-sm font-medium text-primary hover:underline focus-visible:outline-none"
					>
						Clear All
					</button>
				</div>
			{/if}
		</div>

		<!-- Table -->
		<div class="rounded-lg border border-border bg-card shadow-2xl">
			<div class="flex items-center justify-between gap-2 p-4">
				<span class="text-sm text-muted-foreground">
					{#if list.loading}Loading settlements…{:else}{showingText}{/if}
				</span>
				<div class="flex items-center gap-2">
					<Button variant="outline" onclick={list.retry}>
						<RefreshCw />
					</Button>
				</div>
			</div>

			{#if list.error}
				<StatePanel
					title="Couldn't load settlements"
					description={list.error}
					actionLabel="Retry"
					onAction={list.retry}
				/>
			{:else if !list.loading && filteredData.length === 0}
				<StatePanel
					title="No settlements for {dateLabel}"
					description="Try picking a different date, or clear the current filters."
				/>
			{:else}
				<Table
					data={displayRows}
					{columns}
					pageNumber={pagination.currentPage}
					totalPages={pagination.pageCount}
					setPageNumber={pagination.setPage}
					variant="borderless"
					loading={list.loading}
					skeletonRows={8}
					onRowClick={goToDetail}
					isRowClickable={(row) => row.status === 'completed'}
					getRowAriaLabel={rowAriaLabel}
				/>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet disbursementsTab()}
	<div class="pt-4">
		<StatePanel
			title="Disbursement settlements aren't available yet"
			description="This tab will show partner disbursement settlements once that data source is connected."
		/>
	</div>
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Settlements</h1>
		<p class="text-sm text-muted-foreground">Merchant settlements for {dateLabel}</p>
	</div>

	<Tabs
		tabs={[
			{ value: 'collections', label: 'Collections', content: collectionsTab },
			{ value: 'disbursements', label: 'Disbursements', content: disbursementsTab }
		]}
		value={tabParam}
		onValueChange={handleTabChange}
	/>
</div>
