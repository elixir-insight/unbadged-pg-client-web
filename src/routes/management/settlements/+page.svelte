<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		Button,
		FilterCards,
		Search,
		Tabs,
		createUrlPagination
	} from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { debounce } from '$lib/utils/debounce';
	import { useOrderStats, useSettlementsList } from './use-settlements-list.svelte';
	import SettlementStatusBadge from './settlement-status-badge.svelte';
	import SettlementDatePicker from './settlement-date-picker.svelte';
	import StatePanel from './state-panel.svelte';
	import type { SettlementStatus, SettlementTab } from './types';

	// ── URL-derived filters — date/status/search/tab all live in query params
	// so a refresh or shared link reproduces the exact same view, and the
	// detail page can hand them straight back on "Back". No `date` param at
	// all means "not yet interacted with" and defaults to yesterday; the
	// sentinel `date=none` means the user explicitly cleared it. ─────────────
	function yesterdayIso(): string {
		return today(getLocalTimeZone()).subtract({ days: 1 }).toString();
	}

	const dateParam = $derived.by(() => {
		const raw = page.url.searchParams.get('date');
		if (raw === null) return yesterdayIso();
		if (raw === 'none') return '';
		return raw;
	});
	const selectedDate = $derived<DateValue | undefined>(
		dateParam ? parseDate(dateParam) : undefined
	);
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
	const dateLabel = $derived(
		selectedDate ? dateFormatter.format(selectedDate.toDate(getLocalTimeZone())) : ''
	);

	const pagination = createUrlPagination({ defaultLimit: 8, total: () => filteredData.length });

	// searchInput is derived from the URL so back/forward navigation restores
	// it, and can be overridden locally for immediate keystroke feedback while
	// the URL update itself is debounced.
	let searchInput = $derived(pagination.search);

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		searchInput = value;
		debouncedSearch(value);
	}

	// "Total Orders", "Successful", and "Pending" have a real settlement-status
	// equivalent — a successful order is one whose settlement has gone through
	// (status: 'completed'), so their counts come from the settlements
	// themselves, not the order-service stat, and clicking maps onto the same
	// status values shown in the table's Status column. "Created"/"Failed"
	// orders never reach the settlement pipeline at all, so they keep the
	// order-level count and always filter to zero rows (explained below).
	const totalSettlementCount = $derived(list.items.length);
	const completedSettlementCount = $derived(
		list.items.filter((item) => item.status === 'completed').length
	);
	const pendingSettlementCount = $derived(
		list.items.filter((item) => item.status === 'pending').length
	);

	const CARD_STATUS: Record<string, string> = {
		'Total Orders': '',
		Successful: 'completed',
		Pending: 'pending',
		Created: 'created',
		Failed: 'failed'
	};
	const STATUS_CARD: Record<string, string> = {
		completed: 'Successful',
		pending: 'Pending',
		created: 'Created',
		failed: 'Failed'
	};

	let selectedOrderCard = $derived(STATUS_CARD[pagination.status] ?? 'Total Orders');

	function selectOrderCard(label: string) {
		pagination.setStatus(CARD_STATUS[label] ?? '');
	}

	function removeFilter(key: 'date' | 'status' | 'search') {
		if (key === 'date') updateParams({ date: 'none', skip: null });
		else if (key === 'status') pagination.setStatus('');
		else pagination.setSearch('');
	}

	function clearAllFilters() {
		// A single atomic navigate — calling setDate/setStatus/setSearch
		// separately would race, since each reads page.url before the other's
		// goto() has resolved and can clobber it.
		updateParams({ date: 'none', status: null, search: null, skip: null });
	}

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'search'; label: string; value: string }[] = [];
		if (selectedDate) {
			filters.push({ key: 'date', label: 'Date', value: dateLabel });
		}
		if (pagination.status) {
			const label = pagination.status.charAt(0).toUpperCase() + pagination.status.slice(1);
			filters.push({ key: 'status', label: 'Status', value: label });
		}
		if (pagination.search) {
			filters.push({ key: 'search', label: 'Merchant', value: pagination.search });
		}
		return filters;
	});

	// "created"/"failed" are order statuses with no settlement-status
	// counterpart (those orders never reach the settlement pipeline), so
	// filtering by one of them always yields zero rows below.
	const orderOnlyStatusLabel = $derived.by(() => {
		if (pagination.status !== 'created' && pagination.status !== 'failed') {
			return null;
		}
		return pagination.status.charAt(0).toUpperCase() + pagination.status.slice(1);
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
		<!-- Order-level summary, filtered down to the three cards that map onto
		     a real settlement status: "Total Orders" (clear filter), "Successful"
		     (a successful order is a settlement that's gone through — status:
		     'completed'), and "Pending" (status: 'pending'). Each shows the
		     matching settlement-side count, not the order-service one, so the
		     card number always equals the rows clicking it reveals. "Created"/
		     "Failed" orders never reach the settlement pipeline at all, so
		     there's no card for them here — see orderOnlyStatusLabel below for
		     the defensive empty state if one is still reached via a direct URL
		     (e.g. an old bookmarked link). -->
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
				skeletonCount={3}
				cards={[
					{ label: 'Total Orders', count: totalSettlementCount },
					{ label: 'Successful', count: completedSettlementCount },
					{ label: 'Pending', count: pendingSettlementCount }
				]}
				bind:selected={selectedOrderCard}
				onselect={selectOrderCard}
				class="grid-cols-1 sm:grid-cols-3"
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
					<Search
						value={searchInput}
						oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
						placeholder="Search merchant…"
						variant="bordered"
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
					{#if !selectedDate}Select a date to view settlements{:else if list.loading}Loading
						settlements…{:else}{showingText}{/if}
				</span>
				<div class="flex items-center gap-2">
					<Button variant="outline" onclick={list.retry}>
						<RefreshCw />
					</Button>
				</div>
			</div>

			{#if !selectedDate}
				<StatePanel
					title="No date selected"
					description="Choose a settlement date above to view collections."
				/>
			{:else if list.error}
				<StatePanel
					title="Couldn't load settlements"
					description={list.error}
					actionLabel="Retry"
					onAction={list.retry}
				/>
			{:else if !list.loading && filteredData.length === 0}
				{#if orderOnlyStatusLabel}
					<StatePanel
						title="No settlements for {orderOnlyStatusLabel} orders"
						description="'{orderOnlyStatusLabel}' is an order status, not a settlement status — settlements are only ever Completed or Pending, so this filter can't match a settlement row. Clear it to see settlements again."
						actionLabel="Clear filter"
						onAction={() => pagination.setStatus('')}
					/>
				{:else}
					<StatePanel
						title="No settlements for {dateLabel}"
						description="Try picking a different date, or clear the current filters."
					/>
				{/if}
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

<div class="space-y-6">
	<Tabs
		tabs={[
			{ value: 'collections', label: 'Collections', content: collectionsTab },
			{ value: 'disbursements', label: 'Disbursements', content: disbursementsTab }
		]}
		value={tabParam}
		onValueChange={handleTabChange}
	/>
</div>
