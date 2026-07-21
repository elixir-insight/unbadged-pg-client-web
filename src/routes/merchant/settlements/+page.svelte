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
		Tabs,
		EmptyState,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { StatCardBadge } from '$lib/components/reusable';
	import UtrCell from '$lib/components/settlements/utr-cell.svelte';
	import OndemandPanel from './ondemand-panel.svelte';
	import type { DateRange } from 'bits-ui';
	import { getLocalTimeZone } from '@internationalized/date';
	import { debounce } from '$lib/utils/debounce.js';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import StatusBadge from './status-badge.svelte';
	import type { Settlement, SettlementStatus } from '$lib/types/settlement';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface SettlementRow extends Settlement, Record<string, unknown> {
		_dateMs: number;
	}

	// Settlement IDs encode their cycle date (STL-YYYYMMDD-####), so we can
	// derive a filterable timestamp even for rows without a settledOn date yet
	// (processing/failed rows).
	function parseIdDate(id: string): number {
		const match = id.match(/^STL-(\d{4})(\d{2})(\d{2})-/);
		if (!match) return Date.now();
		const [, year, month, day] = match;
		return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
	}

	const mockData: SettlementRow[] = $derived(
		data.settlements.map((s) => ({ ...s, _dateMs: parseIdDate(s.id) }))
	);

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

	function formatDate(value: string | null) {
		return value ? dateFormatter.format(new Date(value)) : null;
	}

	// ── Tab state — driven by ?tab= so it's shareable/bookmarkable. Mirrors the
	// Dropdown convention already used below: bind:value for snappy local
	// switching + onValueChange to push the URL update. tabValue stays a plain
	// $derived (writable — Svelte lets a local assignment override it until
	// page.url changes again) so back/forward navigation re-syncs it for free.
	let tabValue = $derived<'scheduled' | 'ondemand'>(
		page.url.searchParams.get('tab') === 'ondemand' ? 'ondemand' : 'scheduled'
	);

	function setTab(value: string) {
		tabValue = value === 'ondemand' ? 'ondemand' : 'scheduled';
		const url = new SvelteURL(page.url.toString());
		if (value === 'ondemand') url.searchParams.set('tab', 'ondemand');
		else url.searchParams.delete('tab');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: false, noScroll: true, keepFocus: true });
	}

	// ── Summary cards — quick status filters, counts derived from the (date
	// filtered) settlement list, same convention as the transactions pages ────
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

	let selectedCard = $state<string>('All Settlements');
	let settlementStatus = $state<string | undefined>(undefined);
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let searchField = $state<string>('id');

	const DAY_MS = 86_400_000;

	// URL-driven pagination — click handling (Prev/Next/page jump) goes through
	// this composable instead of local state, same convention as demo/users.
	const pagination = createUrlPagination({ defaultLimit: 8, total: () => filteredData.length });

	// Local search input — kept in sync with the URL so back/forward navigation
	// restores the value without an extra round-trip, same convention as demo/users.
	let searchInput = $derived(pagination.search);

	$effect(() => {
		searchInput = pagination.search;
	});

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 200);

	function handleSearch(field: string, value: string) {
		searchField = field;
		debouncedSearch(value);
	}

	function selectCard(label: string) {
		const card = summaryCards.find((c) => c.label === label);
		selectedCard = label;
		settlementStatus = card?.status ?? undefined;
		pagination.setPage(1);
	}

	// Dropdown offers the same status options as the cards — kept in sync so
	// either control can drive the filter.
	function onStatusDropdownChange(val: string) {
		const match = summaryCards.find((c) => c.status === val);
		selectedCard = match ? match.label : 'All Settlements';
		pagination.setPage(1);
	}

	function removeFilter(key: 'date' | 'status' | 'search') {
		if (key === 'date') {
			dateRange = { start: undefined, end: undefined };
		} else if (key === 'status') {
			settlementStatus = undefined;
			selectedCard = 'All Settlements';
		} else if (key === 'search') {
			pagination.setSearch('');
			return;
		}
		pagination.setPage(1);
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		settlementStatus = undefined;
		selectedCard = 'All Settlements';
		pagination.setSearch('');
	}

	const dateFilter = $derived.by(() => {
		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			return {
				start: dateRange.start.toDate(tz).getTime(),
				end: dateRange.end.toDate(tz).getTime() + DAY_MS
			};
		}
		return null;
	});

	const dateFilteredData = $derived(
		dateFilter
			? mockData.filter((r) => r._dateMs >= dateFilter.start && r._dateMs <= dateFilter.end)
			: mockData
	);

	const cardCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const card of summaryCards) {
			counts[card.label] =
				card.status === null
					? dateFilteredData.length
					: dateFilteredData.filter((r) => r.status === card.status).length;
		}
		return counts;
	});

	const filterCards = $derived(
		summaryCards.map((c) => ({ label: c.label, count: cardCounts[c.label] ?? 0 }))
	);

	// Amount totals per status bucket — same buckets as cardCounts, summed by
	// gross amount instead of counted, for the stat cards that show ₹ values.
	const cardAmounts = $derived.by(() => {
		const amounts: Record<string, number> = {};
		for (const card of summaryCards) {
			const rows =
				card.status === null
					? dateFilteredData
					: dateFilteredData.filter((r) => r.status === card.status);
			amounts[card.label] = rows.reduce((sum, r) => sum + r.grossAmount, 0);
		}
		return amounts;
	});

	const lastSettlement = $derived.by(() => {
		if (mockData.length === 0) return null;
		return [...mockData].sort((a, b) => b._dateMs - a._dateMs)[0];
	});

	const lastSettlementBadge: StatCardBadge = $derived(
		!lastSettlement
			? { label: '—', variant: 'default' }
			: lastSettlement.status === 'settled'
				? { label: 'Settled', variant: 'success' }
				: lastSettlement.status === 'processing'
					? { label: 'Processing', variant: 'warning' }
					: { label: 'Failed', variant: 'error' }
	);

	// Filters + search combine with AND logic, applied client-side against the
	// already-loaded page of data — no re-fetch on every keystroke.
	const filteredData = $derived.by(() => {
		let result = dateFilteredData;
		if (settlementStatus) {
			result = result.filter((r) => r.status === settlementStatus);
		}
		if (pagination.search) {
			const query = pagination.search.toLowerCase();
			result = result.filter((r) => {
				const fieldValue = searchField === 'utr' ? r.utr : r.id;
				return (fieldValue ?? '').toLowerCase().includes(query);
			});
		}
		return result;
	});

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'search'; label: string; value: string }[] = [];

		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
			const start = dateRange.start.toDate(tz);
			const end = dateRange.end.toDate(tz);
			filters.push({ key: 'date', label: 'Date', value: `${fmt(start)} – ${fmt(end)}` });
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

	const pagedData = $derived(
		filteredData.slice(pagination.skip, pagination.skip + pagination.limit)
	);
	const showingText = $derived(`${pagination.showingText} settlements`);

	// Table-display rows — amounts/dates pre-formatted to plain strings so the
	// column defs stay simple (accessorKey + header, no per-column snippets),
	// same convention as the payins/payouts transaction tables.
	interface SettlementDisplayRow extends Record<string, unknown> {
		_id: string;
		id: string;
		utr: string | null;
		amount: string;
		fees: string;
		netAmount: string;
		settledOn: string;
		status: SettlementStatus;
	}

	const displayRows = $derived<SettlementDisplayRow[]>(
		pagedData.map((r) => ({
			_id: r.id,
			id: r.id,
			utr: r.utr,
			amount: currency.format(r.grossAmount),
			fees: currency.format(r.fees),
			netAmount: currency.format(r.netAmount),
			settledOn: formatDate(r.settledOn) ?? formatDate(r.expectedOn) ?? '—',
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
		goto(resolve('/merchant/settlements/[settlementId]', { settlementId: row._id }));
	}
</script>

{#snippet scheduledContent()}
	<!-- Filter bar -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-2">
				<DateRangePicker
					bind:value={dateRange}
					onApply={() => {
						pagination.setPage(1);
					}}
				/>
				<div class="w-50">
					<Dropdown
						bind:value={settlementStatus}
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
	<div class="mt-6 rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
			</div>
		</div>

		{#if filteredData.length === 0}
			<EmptyState
				title="No settlements match your filters"
				description="Try a different date range, status, or search term."
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
{/snippet}

{#snippet ondemandContent()}
	<div class="mt-6">
		<OndemandPanel />
	</div>
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<!-- Header -->

	<!-- Summary + stat cards -->
	{#if data.accountSettlementConfig.instantSettlementEligible}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				label="Total Settlements"
				value={currency.format(cardAmounts['All Settlements'] ?? 0)}
				badge={{ label: 'All time', variant: 'default' }}
				subtext="{cardCounts['All Settlements'] ?? 0} settlements · across all statuses"
			/>
			<StatCard
				label="Awaiting Settlements"
				value={currency.format(cardAmounts['Processing'] ?? 0)}
				badge={{ label: 'Processing', variant: 'warning' }}
				subtext="{cardCounts['Processing'] ?? 0} settlements currently being processed"
			/>
			<StatCard
				label="Last Settlement Amount"
				value={lastSettlement ? currency.format(lastSettlement.netAmount) : '—'}
				badge={lastSettlementBadge}
				subtext={lastSettlement ? `Settlement ${lastSettlement.id}` : 'No settlements yet'}
			/>
		</div>
	{:else}
		<FilterCards
			loading={false}
			skeletonCount={4}
			cards={filterCards}
			bind:selected={selectedCard}
			onselect={selectCard}
			class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
		/>
	{/if}

	<!-- Tabs -->
	<Tabs
		tabs={[
			{ value: 'scheduled', label: 'Settlements', content: scheduledContent },
			{ value: 'ondemand', label: 'On-Demand Settlements', content: ondemandContent }
		]}
		bind:value={tabValue}
		onValueChange={setTab}
		class="gap-6"
	/>
</div>
