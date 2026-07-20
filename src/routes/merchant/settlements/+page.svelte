<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import {
		Chip,
		Button,
		DateRangePicker,
		Dropdown,
		FilterCards,
		SearchField,
		StatCard,
		EmptyState,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { StatCardBadge } from '$lib/components/reusable';
	import UtrCell from '$lib/components/settlements/utr-cell.svelte';
	import type { DateRange } from 'bits-ui';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import { debounce } from '$lib/utils/debounce.js';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import StatusBadge from './status-badge.svelte';
	import type { SettlementStatus } from '$lib/types/settlement';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const summaryCards: { label: string; status: SettlementStatus | null }[] = [
		{ label: 'All Settlements', status: null },
		{ label: 'Settled', status: 'settled' },
		{ label: 'Processing', status: 'processing' },
		{ label: 'Failed', status: 'failed' }
	];

	const statusOptions = [
		{ value: 'settled', label: 'Settled' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'failed', label: 'Failed' }
	];

	const searchFields = [
		{ value: 'id', label: 'Settlement ID', placeholder: 'e.g. STL-20260701-0001…' },
		{ value: 'utr', label: 'UTR', placeholder: 'e.g. UTR2607010001…' }
	];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let settlementStatus = $derived<string | undefined>(pagination.status || undefined);
	let selectedCard = $derived(
		summaryCards.find((c) => (c.status ?? '') === (settlementStatus ?? ''))?.label ??
			'All Settlements'
	);

	let searchField = $state<string>('id');
	let searchInput = $derived(pagination.search);
	let refreshing = $state(false);

	function parseUrlDate(value: string | null): CalendarDate | undefined {
		if (!value) return undefined;
		try {
			return parseDate(value);
		} catch {
			return undefined;
		}
	}

	let dateRange = $derived<DateRange>({
		start: parseUrlDate(page.url.searchParams.get('fromDate')),
		end: parseUrlDate(page.url.searchParams.get('toDate'))
	});

	function navigateDateParams(fromDate: string | null, toDate: string | null) {
		const url = new SvelteURL(page.url.toString());
		if (fromDate) url.searchParams.set('fromDate', fromDate);
		else url.searchParams.delete('fromDate');
		if (toDate) url.searchParams.set('toDate', toDate);
		else url.searchParams.delete('toDate');
		url.searchParams.delete('skip');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	function applyDateRange(range: DateRange) {
		if (range.start && range.end) {
			navigateDateParams(range.start.toString(), range.end.toString());
		} else {
			navigateDateParams(null, null);
		}
	}

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 200);

	function handleSearch(field: string, value: string) {
		searchField = field;
		debouncedSearch(value);
	}

	function selectCard(label: string) {
		const card = summaryCards.find((c) => c.label === label);
		pagination.setStatus(card?.status ?? '');
	}

	function onStatusDropdownChange(val: string) {
		pagination.setStatus(val || '');
	}

	function removeFilter(key: 'date' | 'status' | 'search') {
		if (key === 'date') {
			navigateDateParams(null, null);
		} else if (key === 'status') {
			pagination.setStatus('');
		} else if (key === 'search') {
			pagination.setSearch('');
		}
	}

	function clearAllFilters() {
		const url = new SvelteURL(page.url.toString());
		url.searchParams.delete('fromDate');
		url.searchParams.delete('toDate');
		url.searchParams.delete('status');
		url.searchParams.delete('search');
		url.searchParams.delete('skip');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function refreshList() {
		refreshing = true;
		try {
			await invalidate('settlements:list');
		} finally {
			refreshing = false;
		}
	}

	// FilterCards cannot get accurate per-status counts from this API — show the
	// current filtered total on the selected card and leave others unmarked.
	const filterCards = $derived(
		summaryCards.map((c) => ({
			label: c.label,
			count:
				c.status === (settlementStatus ?? null) || (c.status === null && !settlementStatus)
					? data.pagination.total
					: 0
		}))
	);

	const lastSettlementBadge: StatCardBadge = $derived(
		!data.overview.lastSettlement
			? { label: '—', variant: 'default' }
			: { label: 'Settled', variant: 'success' }
	);

	const lastSettlementSubtext = $derived.by(() => {
		const last = data.overview.lastSettlement;
		if (!last) return 'No settlements yet';
		const parts = [`Settlement ${last.settlementId}`];
		if (last.settlementDatetime) parts.push(last.settlementDatetime);
		return parts.join(' · ');
	});

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'search'; label: string; value: string }[] = [];

		const fromDate = page.url.searchParams.get('fromDate');
		const toDate = page.url.searchParams.get('toDate');
		if (fromDate && toDate && dateRange.start && dateRange.end) {
			const fmt = (d: CalendarDate) =>
				d.toDate('Asia/Kolkata').toLocaleDateString('en-IN', {
					day: '2-digit',
					month: 'short'
				});
			filters.push({
				key: 'date',
				label: 'Date',
				value: `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`
			});
		}

		if (settlementStatus) {
			const opt = statusOptions.find((o) => o.value === settlementStatus);
			filters.push({ key: 'status', label: 'Status', value: opt?.label ?? settlementStatus });
		}

		if (pagination.search) {
			const opt = searchFields.find((f) => f.value === searchField);
			filters.push({ key: 'search', label: opt?.label ?? 'Search', value: pagination.search });
		}

		return filters;
	});

	const showingText = $derived(
		data.listError ? 'Unable to load settlements' : `${pagination.showingText} settlements`
	);

	interface SettlementDisplayRow extends Record<string, unknown> {
		id: string;
		utr: string | null;
		amount: string;
		fees: string;
		netAmount: string;
		settledOn: string;
		status: SettlementStatus;
	}

	const displayRows = $derived<SettlementDisplayRow[]>(
		data.settlements.map((r) => ({
			id: r.id,
			utr: r.utr,
			amount: r.amount,
			fees: r.fees,
			netAmount: r.netAmount,
			settledOn: r.settledOn,
			status: r.status
		}))
	);

	const columns: ColumnDef<SettlementDisplayRow>[] = [
		{ accessorKey: 'id', header: 'Settlement ID' },
		{
			accessorKey: 'utr',
			header: 'UTR',
			cell: (info) => renderComponent(UtrCell, { utr: info.getValue<string | null>() })
		},
		{ accessorKey: 'amount', header: 'Amount Settled', enableSorting: true },
		{ accessorKey: 'fees', header: 'Fees & Tax' },
		{ accessorKey: 'netAmount', header: 'Net Amount' },
		{ accessorKey: 'settledOn', header: 'Settled / Expected On' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderComponent(StatusBadge, { status: info.getValue<SettlementStatus>() })
		}
	];

	function goToSettlement(row: SettlementDisplayRow) {
		goto(resolve('/merchant/settlements/[settlementId]', { settlementId: row.id }));
	}
</script>

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<!-- Summary + stat cards -->
	{#if data.accountSettlementConfig.instantSettlementEligible}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				label="Total Settlements"
				value={data.overview.totalSettledAmount}
				badge={{ label: 'All time', variant: 'default' }}
				subtext={data.overviewError ? 'Unable to load overview' : 'Total amount settled to date'}
			/>
			<StatCard
				label="Awaiting Settlements"
				value={data.overview.awaitingSettlementAmount}
				badge={{ label: 'Processing', variant: 'warning' }}
				subtext={data.overviewError ? 'Unable to load overview' : 'Amount pending settlement'}
			/>
			<StatCard
				label="Last Settlement Amount"
				value={data.overview.lastSettlement?.amount ?? '—'}
				badge={lastSettlementBadge}
				subtext={data.overviewError ? 'Unable to load overview' : lastSettlementSubtext}
			/>
		</div>
	{:else}
		<FilterCards
			loading={false}
			skeletonCount={4}
			cards={filterCards}
			selected={selectedCard}
			onselect={selectCard}
			class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
		/>
	{/if}

	<!-- Filter bar -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-2">
				<DateRangePicker bind:value={dateRange} onApply={applyDateRange} />
				<div class="w-50">
					<Dropdown
						value={settlementStatus}
						placeholder="Status"
						disabled={false}
						bordered={false}
						search={false}
						options={statusOptions}
						onValueChange={onStatusDropdownChange}
					/>
				</div>
			</div>
			<div class="w-full max-w-xs">
				<SearchField
					fields={searchFields}
					bind:field={searchField}
					value={searchInput}
					onSearch={handleSearch}
				/>
			</div>
		</div>

		<!-- Active filter chips -->
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
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					onclick={refreshList}
					disabled={refreshing}
					aria-label="Refresh settlements"
				>
					<RefreshCw class={refreshing ? 'animate-spin' : undefined} />
				</Button>
			</div>
		</div>

		{#if data.settlements.length === 0}
			<EmptyState
				title={data.listError ? 'Unable to load settlements' : 'No settlements match your filters'}
				description={data.listError
					? data.listError
					: 'Try a different date range, status, or search term.'}
				actionLabel={activeFilters.length > 0 ? 'Clear filters' : undefined}
				onaction={clearAllFilters}
			/>
		{:else}
			<Table
				data={displayRows}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				onRowClick={goToSettlement}
				variant="borderless"
			/>
		{/if}
	</div>
</div>
