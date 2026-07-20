<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- tab hrefs append query params after resolve() */
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		Button,
		Dropdown,
		Search,
		FilterStatCard,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { StatCardTone } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { debounce } from '$lib/utils/debounce';
	import { getCurrentSettlementMerchantId } from './settlement-scope.svelte';
	import SettlementStatusBadge from './settlement-status-badge.svelte';
	import SettlementDatePicker from './settlement-date-picker.svelte';
	import StatePanel from './state-panel.svelte';
	import type { SettlementStatus, SettlementTab } from './types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dateParam = $derived.by(() => {
		const raw = page.url.searchParams.get('date');
		if (!raw || raw === 'none') return '';
		return raw;
	});
	const selectedDate = $derived<DateValue | undefined>(
		dateParam ? parseDate(dateParam) : undefined
	);
	const tabParam = $derived<SettlementTab>(
		page.url.searchParams.get('tab') === 'disbursements' ? 'disbursements' : 'collections'
	);

	const tabs = [
		{ value: 'collections', label: 'Collections' },
		{ value: 'disbursements', label: 'Disbursements' }
	] as const;

	function tabHref(tab: (typeof tabs)[number]['value']): string {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		if (tab === 'collections') {
			searchParams.delete('tab');
		} else {
			searchParams.set('tab', tab);
		}
		searchParams.delete('skip');
		const qs = searchParams.toString();
		const base = resolve('/management/settlements');
		return (qs ? `${base}?${qs}` : base) as '/management/settlements';
	}

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

	const merchantId = $derived(getCurrentSettlementMerchantId());

	const statusOptions = [
		{ value: 'completed', label: 'Completed' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'failed', label: 'Failed' }
	];

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

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let searchInput = $derived(pagination.search);
	let refreshing = $state(false);

	$effect(() => {
		searchInput = pagination.search;
	});

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		searchInput = value;
		debouncedSearch(value);
	}

	function onStatusDropdownChange(value: string) {
		pagination.setStatus(value);
	}

	function applyStatusFilter(status: SettlementStatus | null) {
		pagination.setStatus(status ?? '');
	}

	function removeFilter(key: 'date' | 'status' | 'search') {
		if (key === 'date') updateParams({ date: 'none', skip: null });
		else if (key === 'status') pagination.setStatus('');
		else pagination.setSearch('');
	}

	function clearAllFilters() {
		updateParams({ date: 'none', status: null, search: null, skip: null });
	}

	async function refreshList() {
		refreshing = true;
		try {
			await invalidate('management-settlements:list');
		} finally {
			refreshing = false;
		}
	}

	const filteredTotal = $derived(data.pagination.total);
	const pageSaleTotal = $derived(data.settlements.reduce((sum, item) => sum + item.saleAmount, 0));
	const pagePendingSaleTotal = $derived(
		data.settlements
			.filter((item) => item.status === 'pending')
			.reduce((sum, item) => sum + item.saleAmount, 0)
	);

	const lastSettlement = $derived.by(() => {
		if (data.settlements.length === 0) return null;
		return [...data.settlements].sort((a, b) =>
			b.settlementDate.localeCompare(a.settlementDate)
		)[0];
	});
	const lastSettlementBadge: { text: string; variant: StatCardTone } = $derived(
		!lastSettlement
			? { text: '—', variant: 'brand' }
			: lastSettlement.status === 'completed'
				? { text: 'Completed', variant: 'success' }
				: lastSettlement.status === 'failed'
					? { text: 'Failed', variant: 'error' }
					: { text: 'Pending', variant: 'warning' }
	);

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'search'; label: string; value: string }[] = [];
		if (selectedDate) {
			filters.push({ key: 'date', label: 'Date', value: dateLabel });
		}
		if (pagination.status) {
			const opt = statusOptions.find((o) => o.value === pagination.status);
			filters.push({ key: 'status', label: 'Status', value: opt?.label ?? pagination.status });
		}
		if (pagination.search) {
			filters.push({ key: 'search', label: 'Settlement ID', value: pagination.search });
		}
		return filters;
	});

	const showingText = $derived(
		data.listError ? 'Unable to load settlements' : `${pagination.showingText} settlements`
	);

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
		data.settlements.map((r) => ({
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

	function goToDetail(row: SettlementDisplayRow) {
		const params = new SvelteURLSearchParams();
		if (dateParam) params.set('date', dateParam);
		params.set('merchantId', merchantId);
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
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<FilterStatCard
				label="Total Settlements"
				value={currency.format(pageSaleTotal)}
				badgeText="All time"
				badgeVariant="brand"
				subText="{!pagination.status
					? filteredTotal
					: data.settlements.length} settlements · current view"
				selected={!pagination.status}
				onclick={() => applyStatusFilter(null)}
			/>
			<FilterStatCard
				label="Awaiting Settlements"
				value={currency.format(pagePendingSaleTotal)}
				badgeText="Pending"
				badgeVariant="warning"
				subText="{pagination.status === 'pending' ? filteredTotal : '—'} pending in current filter"
				selected={pagination.status === 'pending'}
				onclick={() => applyStatusFilter('pending')}
			/>
			<FilterStatCard
				label="Last Settlement Amount"
				value={lastSettlement ? currency.format(lastSettlement.netPayout) : '—'}
				badgeText={lastSettlementBadge.text}
				badgeVariant={lastSettlementBadge.variant}
				subText={lastSettlement
					? `Settlement ${lastSettlement.settlementId}`
					: 'No settlements yet'}
			/>
		</div>

		<!-- Filter bar -->
		<div class="flex flex-col gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<SettlementDatePicker
					value={selectedDate}
					maxValue={today(getLocalTimeZone())}
					placeholder="Filter by date"
					onChange={setDate}
				/>
				<div class="w-full sm:w-50">
					<Dropdown
						value={pagination.status || undefined}
						placeholder="Status"
						disabled={false}
						bordered={false}
						search={false}
						options={statusOptions}
						onValueChange={onStatusDropdownChange}
					/>
				</div>
				<div class="w-full min-w-0 sm:ml-auto sm:max-w-xs">
					<Search
						value={searchInput}
						oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
						placeholder="Search settlement ID…"
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

			{#if data.listError}
				<StatePanel
					title="Couldn't load settlements"
					description={data.listError}
					actionLabel="Retry"
					onAction={refreshList}
				/>
			{:else if data.settlements.length === 0}
				{#if selectedDate}
					<StatePanel
						title="No settlements for {dateLabel}"
						description="Try picking a different date, clearing the status filter, or adjusting your search."
					/>
				{:else if pagination.status}
					<StatePanel
						title="No {statusOptions.find((o) => o.value === pagination.status)?.label ??
							pagination.status} settlements"
						description="Try a different status or clear the current filters."
						actionLabel="Clear filter"
						onAction={() => pagination.setStatus('')}
					/>
				{:else}
					<StatePanel
						title="No settlements for this merchant"
						description="Try clearing the current filters or selecting a different merchant."
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
					onRowClick={goToDetail}
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

<div class="flex flex-col gap-4">
	<nav class="flex gap-1 border-b border-border">
		{#each tabs as tab (tab.value)}
			<a
				href={tabHref(tab.value)}
				class="relative px-3 pb-2 text-sm font-medium transition-colors {tabParam === tab.value
					? '-mb-px border-b-2 border-foreground text-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	{#if tabParam === 'collections'}
		{@render collectionsTab()}
	{:else}
		{@render disbursementsTab()}
	{/if}
</div>
