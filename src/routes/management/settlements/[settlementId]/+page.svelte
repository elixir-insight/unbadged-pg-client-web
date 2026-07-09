<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		FilterCards,
		SearchField,
		Avatar,
		createUrlPagination
	} from '$lib/components/reusable';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowLeft } from '$lib/assets/icons';
	import { debounce } from '$lib/utils/debounce.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
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

	// Pending/Failed are order-level outcomes — an order only produces a
	// settlement transaction once it's captured (sale) or later adjusted
	// (refund/chargeback), so this ledger never contains a pending/failed
	// row. Filtering by either (via pagination.status) is a real filter, and
	// always — correctly — yields zero rows; the empty state below explains
	// why.
	const statFilter = $derived(
		pagination.status === 'pending' || pagination.status === 'failed' ? pagination.status : null
	);

	// All 5 stat cards are clickable/selectable (same FilterCards pattern as
	// the settlements list page's order cards): "Orders" is the neutral/all
	// state and clears the filter, "Pending"/"Failed" drive pagination.status
	// for real, "Successful"/"Created" are visual-only picks (no settlement-
	// transaction equivalent) — selectedStatCard tracks those locally, and
	// re-syncs from the URL whenever Pending/Failed changes some other way
	// (e.g. the empty state's "Clear filter" action).
	let selectedStatCard = $state('Orders');
	$effect(() => {
		if (pagination.status === 'pending') selectedStatCard = 'Pending';
		else if (pagination.status === 'failed') selectedStatCard = 'Failed';
		else if (selectedStatCard === 'Pending' || selectedStatCard === 'Failed') {
			selectedStatCard = 'Orders';
		}
	});

	function selectStatCard(label: string) {
		if (label === 'Orders') pagination.setStatus('');
		else if (label === 'Pending') pagination.setStatus('pending');
		else if (label === 'Failed') pagination.setStatus('failed');
	}

	function clearStatFilter() {
		pagination.setStatus('');
	}

	const filteredTransactions = $derived.by(() => {
		const transactions = detail.detail?.transactions ?? [];
		if (statFilter) return [];
		if (!pagination.search) return transactions;
		const q = pagination.search.toLowerCase();
		return transactions.filter(
			(t) => t.transactionId.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q)
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

	function handleSearch(_field: string, value: string) {
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
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each [...Array(5).keys()] as i (i)}
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

		<!-- Merchant-scoped order stats — same clickable FilterCards pattern as
		     the settlements list page. "Orders" clears the filter; "Pending"/
		     "Failed" filter the transaction table below for real (pending/
		     failed orders never produce a settlement transaction, so it always
		     — correctly — shows none); "Successful"/"Created" are visual-only. -->
		<FilterCards
			loading={false}
			cards={[
				{ label: 'Orders', count: s.orderStats.orders },
				{ label: 'Successful', count: s.orderStats.successful },
				{ label: 'Pending', count: s.orderStats.pending },
				{ label: 'Created', count: s.orderStats.created },
				{ label: 'Failed', count: s.orderStats.failed }
			]}
			bind:selected={selectedStatCard}
			onselect={selectStatCard}
			class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
		/>

		<!-- Transactions -->
		<div class="rounded-lg border border-border bg-card shadow-2xl">
			<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
				<span class="text-sm text-muted-foreground">
					{filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
				</span>
				<div class="w-full max-w-xs">
					<SearchField
						fields={[
							{ value: 'transactionId', label: 'Transaction ID', placeholder: 'e.g. TXN-MER01-…' },
							{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-MER01-…' }
						]}
						field="transactionId"
						value={searchInput}
						onSearch={handleSearch}
					/>
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
				{:else}
					<StatePanel
						title="No transactions found"
						description={pagination.search
							? `No transactions match "${pagination.search}". Try a different Transaction ID or Order ID.`
							: 'This settlement has no transactions.'}
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
