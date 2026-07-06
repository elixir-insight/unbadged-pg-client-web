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
		createUrlPagination
	} from '$lib/components/reusable';
	import type { DateRange } from 'bits-ui';
	import { getLocalTimeZone } from '@internationalized/date';
	import { debounce } from '$lib/utils/debounce.js';
	import { Download, RefreshCw, X } from '$lib/assets/icons';
	import StatusBadge from './status-badge.svelte';

	// ── Types + mock data — one-line swap for a real API call later, e.g.:
	// const settlements = await api.get<Settlement[]>('/merchant/settlements');
	type SettlementStatus = 'success' | 'reject' | 'in_review';

	type Settlement = {
		id: string;
		utr: string | null;
		amount: number;
		fees: number;
		netAmount: number;
		status: SettlementStatus;
		settledOn: string | null;
		transactionCount: number;
	};

	interface SettlementRow extends Settlement, Record<string, unknown> {
		_dateMs: number;
	}

	const DAY_MS = 86_400_000;

	// Settlement IDs encode their cycle date (STL-YYYYMMDD-####), so we can
	function parseIdDate(id: string): number {
		const match = id.match(/^STL-(\d{4})(\d{2})(\d{2})-/);
		if (!match) return Date.now();
		const [, year, month, day] = match;
		return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
	}

	const settlements: Settlement[] = [
		{
			id: 'STL-20260701-0001',
			utr: 'UTR2607010001',
			amount: 184500,
			fees: 3690,
			netAmount: 180810,
			status: 'success',
			settledOn: '2026-07-01',
			transactionCount: 42
		},
		{
			id: 'STL-20260701-0002',
			utr: 'UTR2607010002',
			amount: 92300,
			fees: 1846,
			netAmount: 90454,
			status: 'success',
			settledOn: '2026-07-01',
			transactionCount: 18
		},
		{
			id: 'STL-20260630-0014',
			utr: 'UTR2606300014',
			amount: 256000,
			fees: 5120,
			netAmount: 250880,
			status: 'success',
			settledOn: '2026-06-30',
			transactionCount: 61
		},
		{
			id: 'STL-20260630-0013',
			utr: null,
			amount: 47500,
			fees: 950,
			netAmount: 46550,
			status: 'reject',
			settledOn: null,
			transactionCount: 9
		},
		{
			id: 'STL-20260630-0012',
			utr: 'UTR2606300012',
			amount: 133200,
			fees: 2664,
			netAmount: 130536,
			status: 'success',
			settledOn: '2026-06-30',
			transactionCount: 27
		},
		{
			id: 'STL-20260629-0027',
			utr: null,
			amount: 68900,
			fees: 1378,
			netAmount: 67522,
			status: 'in_review',
			settledOn: null,
			transactionCount: 14
		},
		{
			id: 'STL-20260629-0026',
			utr: 'UTR2606290026',
			amount: 312400,
			fees: 6248,
			netAmount: 306152,
			status: 'success',
			settledOn: '2026-06-29',
			transactionCount: 73
		},
		{
			id: 'STL-20260629-0025',
			utr: null,
			amount: 15600,
			fees: 312,
			netAmount: 15288,
			status: 'reject',
			settledOn: null,
			transactionCount: 3
		},
		{
			id: 'STL-20260628-0041',
			utr: 'UTR2606280041',
			amount: 89000,
			fees: 1780,
			netAmount: 87220,
			status: 'success',
			settledOn: '2026-06-28',
			transactionCount: 21
		},
		{
			id: 'STL-20260628-0040',
			utr: null,
			amount: 41200,
			fees: 824,
			netAmount: 40376,
			status: 'in_review',
			settledOn: null,
			transactionCount: 8
		},
		{
			id: 'STL-20260627-0009',
			utr: 'UTR2606270009',
			amount: 176800,
			fees: 3536,
			netAmount: 173264,
			status: 'success',
			settledOn: '2026-06-27',
			transactionCount: 39
		},
		{
			id: 'STL-20260627-0008',
			utr: 'UTR2606270008',
			amount: 58300,
			fees: 1166,
			netAmount: 57134,
			status: 'success',
			settledOn: '2026-06-27',
			transactionCount: 12
		},
		{
			id: 'STL-20260626-0019',
			utr: null,
			amount: 22400,
			fees: 448,
			netAmount: 21952,
			status: 'reject',
			settledOn: null,
			transactionCount: 5
		},
		{
			id: 'STL-20260626-0018',
			utr: 'UTR2606260018',
			amount: 143700,
			fees: 2874,
			netAmount: 140826,
			status: 'success',
			settledOn: '2026-06-26',
			transactionCount: 33
		},
		{
			id: 'STL-20260625-0031',
			utr: null,
			amount: 51900,
			fees: 1038,
			netAmount: 50862,
			status: 'in_review',
			settledOn: null,
			transactionCount: 11
		},
		{
			id: 'STL-20260625-0030',
			utr: 'UTR2606250030',
			amount: 267500,
			fees: 5350,
			netAmount: 262150,
			status: 'success',
			settledOn: '2026-06-25',
			transactionCount: 58
		},
		{
			id: 'STL-20260624-0007',
			utr: 'UTR2606240007',
			amount: 98600,
			fees: 1972,
			netAmount: 96628,
			status: 'success',
			settledOn: '2026-06-24',
			transactionCount: 24
		},
		{
			id: 'STL-20260624-0006',
			utr: null,
			amount: 33800,
			fees: 676,
			netAmount: 33124,
			status: 'reject',
			settledOn: null,
			transactionCount: 7
		},
		{
			id: 'STL-20260623-0015',
			utr: 'UTR2606230015',
			amount: 219300,
			fees: 4386,
			netAmount: 214914,
			status: 'success',
			settledOn: '2026-06-23',
			transactionCount: 47
		},
		{
			id: 'STL-20260622-0003',
			utr: null,
			amount: 27600,
			fees: 552,
			netAmount: 27048,
			status: 'in_review',
			settledOn: null,
			transactionCount: 6
		}
	];

	const mockData: SettlementRow[] = settlements.map((s) => ({ ...s, _dateMs: parseIdDate(s.id) }));

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

	// ── Summary cards — quick status filters, counts derived from the (date
	// filtered) settlement list, same convention as the transactions pages ────
	const summaryCards: { label: string; status: SettlementStatus | null }[] = [
		{ label: 'All Settlements', status: null },
		{ label: 'Successful', status: 'success' },
		{ label: 'In Review', status: 'in_review' },
		{ label: 'Rejected', status: 'reject' }
	];

	const statusOptions = [
		{ value: 'success', label: 'Success' },
		{ value: 'in_review', label: 'In Review' },
		{ value: 'reject', label: 'Reject' }
	];

	const searchFields = [
		{ value: 'id', label: 'Settlement ID', placeholder: 'e.g. STL-20260701-0001…' },
		{ value: 'utr', label: 'UTR', placeholder: 'e.g. UTR2607010001…' }
	];

	let selectedCard = $state<string>('All Settlements');
	let settlementStatus = $state<string | undefined>(undefined);
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let searchField = $state<string>('id');

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
	}, 300);

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
		id: string;
		utr: string;
		amount: string;
		fees: string;
		netAmount: string;
		settledOn: string;
		status: SettlementStatus;
	}

	const displayRows = $derived<SettlementDisplayRow[]>(
		pagedData.map((r) => ({
			id: r.id,
			utr: r.utr ?? '—',
			amount: currency.format(r.amount),
			fees: currency.format(r.fees),
			netAmount: currency.format(r.netAmount),
			settledOn: formatDate(r.settledOn) ?? '—',
			status: r.status
		}))
	);

	const columns: ColumnDef<SettlementDisplayRow>[] = [
		{ accessorKey: 'id', header: 'Settlement ID' },
		{ accessorKey: 'utr', header: 'UTR / Ref' },
		{ accessorKey: 'amount', header: 'Amount', enableSorting: true },
		{ accessorKey: 'fees', header: 'Fees & Tax' },
		{ accessorKey: 'netAmount', header: 'Net Amount' },
		{ accessorKey: 'settledOn', header: 'Settled On' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderComponent(StatusBadge, { status: info.getValue<SettlementStatus>() })
		}
	];
</script>

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<!-- Header -->
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Settlements</h1>
	</div>

	<!-- Summary cards -->
	<FilterCards
		loading={false}
		skeletonCount={4}
		cards={filterCards}
		bind:selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
	/>

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
	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
				<Button variant="outline">
					<Download />
					Export
				</Button>
			</div>
		</div>

		<Table
			data={displayRows}
			{columns}
			pageNumber={pagination.currentPage}
			totalPages={pagination.pageCount}
			setPageNumber={pagination.setPage}
			variant="borderless"
		/>
	</div>
</div>
