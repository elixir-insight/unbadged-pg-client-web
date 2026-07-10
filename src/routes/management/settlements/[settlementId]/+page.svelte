<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		FilterCards,
		SearchField,
		Dropdown,
		Avatar,
		createUrlPagination
	} from '$lib/components/reusable';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowLeft, X } from '$lib/assets/icons';
	import { debounce } from '$lib/utils/debounce.js';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import { useSettlementDetail } from './use-settlement-detail.svelte';
	import SettlementStatusBadge from '../settlement-status-badge.svelte';
	import TransactionTypeBadge from './transaction-type-badge.svelte';
	import StatePanel from '../state-panel.svelte';
	import MonoCell from './mono-cell.svelte';
	import AmountCell from './amount-cell.svelte';
	import type { TransactionType } from '../types';

	const settlementId = $derived(page.params.settlementId ?? '');
	const detail = useSettlementDetail(() => settlementId);

	// The list page forwards its own filter state under a `list_` prefix (see
	// goToDetail in the list page) to avoid colliding with this page's own
	// URL-driven pagination below, which reuses the bare skip/limit/search/
	// status param names. Reconstruct the list's plain params from those here.
	function backToList() {
		const params = new SvelteURLSearchParams();
		const date = page.url.searchParams.get('date');
		if (date) params.set('date', date);
		const listStatus = page.url.searchParams.get('list_status');
		if (listStatus) params.set('status', listStatus);
		const listSearch = page.url.searchParams.get('list_search');
		if (listSearch) params.set('search', listSearch);
		const listSkip = page.url.searchParams.get('list_skip');
		if (listSkip) params.set('skip', listSkip);
		const listLimit = page.url.searchParams.get('list_limit');
		if (listLimit) params.set('limit', listLimit);
		const qs = params.toString();
		goto(resolve(qs ? `/management/settlements?${qs}` : '/management/settlements'));
	}

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});
	const datetimeFormatter = new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	// ── In-page transaction search + pagination — URL-driven via the same
	// createUrlPagination composable used elsewhere (e.g. the settlements
	// list page), instead of local component state, so refresh/back-forward
	// preserve the view. Uses the bare skip/limit/search/status param names;
	// the list page forwards its own filter state under a `list_` prefix
	// (see backToList above) so the two never collide on this URL. ─────────
	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => filteredTransactions.length
	});

	// "Pending"/"Failed" are order-level outcomes — an order only produces a
	// settlement transaction once it's captured (sale) or later adjusted
	// (refund/chargeback), so this ledger never contains one. Neither is
	// clickable via the UI anymore (the stat cards below now filter by
	// payment mode instead), but pagination.status/.type are still honored
	// defensively here for an old shared link that set them.
	const statFilter = $derived(
		pagination.status === 'pending' || pagination.status === 'failed' ? pagination.status : null
	);

	function clearStatFilter() {
		pagination.setStatus('');
	}

	// Payment mode isn't part of the shared createUrlPagination composable
	// (it's specific to this ledger), so it's managed directly here as its
	// own URL param — same "read from page.url, goto() to update" pattern
	// backToList uses above.
	const paymentModeParam = $derived(page.url.searchParams.get('mode') ?? '');

	function setPaymentMode(value: string) {
		const url = new SvelteURL(page.url.toString());
		if (value) url.searchParams.set('mode', value);
		else url.searchParams.delete('mode');
		url.searchParams.delete('skip');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	// One entry per payment mode actually present on this settlement's own
	// ledger (not a static catalogue), each with its real transaction count —
	// powers both the stat cards and the dropdown below, so a mode with zero
	// transactions here never shows up in either.
	const paymentModeCounts = $derived.by(() => {
		const counts: { mode: string; count: number }[] = [];
		for (const t of detail.detail?.transactions ?? []) {
			const existing = counts.find((c) => c.mode === t.paymentMode);
			if (existing) existing.count += 1;
			else counts.push({ mode: t.paymentMode, count: 1 });
		}
		return counts;
	});
	const paymentModeOptions = $derived(
		paymentModeCounts.map((c) => ({ value: c.mode, label: c.mode }))
	);

	// The stat cards filter by payment mode: "All" clears the filter and
	// shows the full ledger count, each mode card sets paymentModeParam via
	// setPaymentMode. selectedPaymentModeCard is a writable derived (bound to
	// FilterCards below) so it re-syncs from the URL whenever the filter
	// changes some other way (e.g. the dropdown, or the empty state's "Clear
	// filter" action).
	const transactionCount = $derived(detail.detail?.transactions.length ?? 0);
	let selectedPaymentModeCard = $derived(paymentModeParam || 'All');

	function selectPaymentModeCard(label: string) {
		setPaymentMode(label === 'All' ? '' : label);
	}

	// Which field the search box matches against — kept in its own URL param
	// (same "read from page.url, goto() to update" pattern as paymentMode
	// above) so a refresh or shared link doesn't silently reinterpret an
	// Order ID search as a Transaction ID one.
	const searchFieldParam = $derived(page.url.searchParams.get('searchField') || 'transactionId');

	function setSearchField(value: string) {
		const url = new SvelteURL(page.url.toString());
		if (value && value !== 'transactionId') url.searchParams.set('searchField', value);
		else url.searchParams.delete('searchField');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	const filteredTransactions = $derived.by(() => {
		let transactions = detail.detail?.transactions ?? [];
		if (statFilter) return [];
		if (pagination.type) {
			transactions = transactions.filter((t) => t.type === pagination.type);
		}
		if (paymentModeParam) {
			transactions = transactions.filter((t) => t.paymentMode === paymentModeParam);
		}
		if (!pagination.search) return transactions;
		const q = pagination.search.toLowerCase();
		return transactions.filter((t) =>
			(searchFieldParam === 'orderId' ? t.orderId : t.transactionId).toLowerCase().includes(q)
		);
	});

	const pagedTransactions = $derived(
		filteredTransactions.slice(pagination.skip, pagination.skip + pagination.limit)
	);

	// Local echo of pagination.search so the SearchField input stays smooth
	// while the URL update is debounced, same convention as the list page.
	let searchInput = $derived(pagination.search);
	$effect(() => {
		searchInput = pagination.search;
	});
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearch(field: string, value: string) {
		if (field !== searchFieldParam) setSearchField(field);
		debouncedSearch(value);
	}

	interface TransactionDisplayRow extends Record<string, unknown> {
		transactionId: string;
		orderId: string;
		type: TransactionType;
		grossAmount: string;
		tdrAmount: string;
		netAmount: string;
		netAmountRaw: number;
		paymentMode: string;
	}

	const displayRows = $derived<TransactionDisplayRow[]>(
		pagedTransactions.map((t) => ({
			transactionId: t.transactionId,
			orderId: t.orderId,
			type: t.type,
			grossAmount: currency.format(t.grossAmount),
			tdrAmount: currency.format(t.tdrAmount),
			netAmount: currency.format(t.netAmount),
			netAmountRaw: t.netAmount,
			paymentMode: t.paymentMode
		}))
	);

	const columns: ColumnDef<TransactionDisplayRow>[] = [
		{
			accessorKey: 'transactionId',
			header: 'Transaction ID',
			cell: (info) => renderComponent(MonoCell, { value: info.getValue<string>() })
		},
		{ accessorKey: 'orderId', header: 'Order ID' },
		{
			accessorKey: 'type',
			header: 'Type',
			cell: (info) =>
				renderComponent(TransactionTypeBadge, { type: info.getValue<TransactionType>() })
		},
		{ accessorKey: 'grossAmount', header: 'Gross Amount' },
		{ accessorKey: 'tdrAmount', header: 'Commission (TDR)' },
		{
			accessorKey: 'netAmount',
			header: 'Net Amount',
			cell: (info) => {
				const row = info.row.original;
				return renderComponent(AmountCell, {
					formatted: row.netAmount,
					negative: row.netAmountRaw < 0
				});
			}
		},
		{ accessorKey: 'paymentMode', header: 'Payment Mode' }
	];
</script>

<div class="flex flex-col gap-6 p-6 sm:p-8 lg:p-4">
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={backToList}
			aria-label="Back to Settlements"
			class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
		</button>
		<h1 class="text-2xl font-semibold text-foreground">Settlement Details</h1>
	</div>

	{#if detail.loading}
		<div class="flex flex-col gap-6">
			<Skeleton class="h-24 rounded-xl" />
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
				{#each [...Array(6).keys()] as i (i)}
					<Skeleton class="h-24 rounded-lg" />
				{/each}
			</div>
			<Skeleton class="h-64 rounded-xl" />
		</div>
	{:else if detail.error}
		<StatePanel
			title="Couldn't load settlement"
			description={detail.error}
			actionLabel="Retry"
			onAction={detail.retry}
		/>
	{:else if !detail.detail}
		<StatePanel
			title="Settlement not found"
			description="No record found for ID: {settlementId}"
			actionLabel="Back to Settlements"
			onAction={backToList}
		/>
	{:else}
		{@const s = detail.detail}
		<!-- Header + settlement summary (merged) -->
		<div class="rounded-xl border border-border bg-card shadow-sm">
			<!-- Top zone -->
			<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
				<div class="flex items-center gap-3">
					<Avatar name={s.merchantName} shape="circle" size="lg" />
					<div>
						<p class="text-lg font-semibold text-foreground">{s.merchantName}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">
							<span class="font-mono">{s.settlementId}</span>
							<span class="mx-1">·</span>
							{datetimeFormatter.format(new Date(s.settlementDatetime))}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<SettlementStatusBadge status={s.status} />
				</div>
			</div>

			<div class="border-t border-border"></div>

			<!-- Bottom zone -->
			<div class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-6">
				<div>
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Bank Reference
					</p>
					<p class="mt-1 font-mono text-sm font-medium text-foreground">{s.bankReference}</p>
				</div>
				<div>
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Sale Amount
					</p>
					<p class="mt-1 text-sm font-medium text-foreground">{currency.format(s.saleAmount)}</p>
				</div>
				<div>
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Deductions
					</p>
					<p class="mt-1 text-sm font-medium text-destructive">{currency.format(s.deductions)}</p>
				</div>
				<div>
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Net Payout
					</p>
					<p class="mt-1 text-sm font-medium text-success">{currency.format(s.netPayout)}</p>
				</div>
			</div>
		</div>

		<!-- Payment-mode stat cards — same clickable FilterCards pattern as the
		     settlements list page. "All" clears the filter and shows the full
		     ledger count; each mode card filters the transaction table below by
		     paymentMode (see setPaymentMode above). Modes are derived from this
		     settlement's own ledger, so a mode with zero transactions here never
		     gets a card. -->
		<FilterCards
			loading={false}
			cards={[
				{ label: 'All', count: transactionCount },
				...paymentModeCounts.map((c) => ({ label: c.mode, count: c.count }))
			]}
			bind:selected={selectedPaymentModeCard}
			onselect={selectPaymentModeCard}
			class="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
		/>

		<!-- Transactions -->
		<div class="rounded-lg border border-border bg-card shadow-2xl">
			<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
				<span class="text-sm text-muted-foreground">
					{filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
				</span>
				<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div class="flex items-center gap-1.5">
						<div class="w-full sm:w-44">
							<Dropdown
								value={paymentModeParam || undefined}
								options={paymentModeOptions}
								placeholder="All payment modes"
								search
								onValueChange={(value) => setPaymentMode(value)}
							/>
						</div>
						{#if paymentModeParam}
							<button
								type="button"
								onclick={() => setPaymentMode('')}
								aria-label="Clear payment mode filter"
								class="cursor-pointer rounded-sm p-1 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none"
							>
								<X class="size-3.5" />
							</button>
						{/if}
					</div>
					<div class="w-full sm:max-w-xs">
						<SearchField
							fields={[
								{
									value: 'transactionId',
									label: 'Transaction ID',
									placeholder: 'e.g. TXN-MER01-…'
								},
								{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-MER01-…' }
							]}
							field={searchFieldParam}
							value={searchInput}
							onSearch={handleSearch}
						/>
					</div>
				</div>
			</div>

			{#if filteredTransactions.length === 0}
				{#if statFilter}
					<StatePanel
						title="No settlement transactions for {statFilter} orders"
						description="{statFilter === 'pending'
							? 'Pending'
							: 'Failed'} orders haven't been captured, so they never reach this settlement's transaction ledger — only sales, refunds, and chargebacks do."
						actionLabel="Clear filter"
						onAction={clearStatFilter}
					/>
				{:else if pagination.search}
					{@const fieldLabel = searchFieldParam === 'orderId' ? 'Order ID' : 'Transaction ID'}
					<StatePanel
						title="No transactions found"
						description={`No transactions match "${pagination.search}" in ${fieldLabel}. Try a different value or search field.`}
					/>
				{:else if paymentModeParam}
					<StatePanel
						title="No transactions found"
						description={`No transactions match the "${paymentModeParam}" payment mode for this filter. Try a different mode or clear it.`}
						actionLabel="Clear filter"
						onAction={() => setPaymentMode('')}
					/>
				{:else}
					<StatePanel
						title="No transactions found"
						description="This settlement has no transactions."
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
				/>
			{/if}
		</div>
	{/if}
</div>
