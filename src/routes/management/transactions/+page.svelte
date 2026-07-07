<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURL } from 'svelte/reactivity';
	import { createUrlPagination, toast } from '$lib/components/reusable';
	import { debounce } from '$lib/utils/debounce';
	import { RotateCcw } from '$lib/assets/icons';
	import {
		merchants,
		getTransactionSummary,
		getTransactionList,
		getTransactionById,
		getAuditHistory,
		recordRefundInitiated,
		type PayinTransaction,
		type AuditEvent,
		type TransactionType,
		type TransactionStatus,
		type TransactionSummary
	} from '$lib/data/payin-transactions-mock';
	import PayinInsightCards from '$lib/components/transactions/insight-cards.svelte';
	import PayinFiltersToolbar from '$lib/components/transactions/filters-toolbar.svelte';
	import PayinTransactionsTable from '$lib/components/transactions/transactions-table.svelte';
	import PayinTransactionDrawer from '$lib/components/transactions/transaction-drawer.svelte';
	import RefundModal from '$lib/components/transactions/refund-modal.svelte';

	const LIMIT = 10;

	// ── URL params (source of truth for filters/search/pagination) ────────────
	const urlMerchantId = $derived(page.url.searchParams.get('merchant') ?? merchants[0]?.id ?? '');
	const urlType = $derived((page.url.searchParams.get('type') ?? '') as TransactionType | '');
	const urlStatus = $derived((page.url.searchParams.get('status') ?? '') as TransactionStatus | '');
	const urlFrom = $derived(page.url.searchParams.get('from') ?? '');
	const urlTo = $derived(page.url.searchParams.get('to') ?? '');
	const urlSearchField = $derived(page.url.searchParams.get('field') ?? 'crn');
	const urlSearchValue = $derived(page.url.searchParams.get('search') ?? '');

	const selectedMerchant = $derived(
		merchants.find((m) => m.id === urlMerchantId) ?? merchants[0] ?? null
	);
	const dateInvalid = $derived(!!urlFrom && !!urlTo && urlFrom > urlTo);
	const hasActiveFilters = $derived(
		!!urlType || !!urlStatus || !!urlFrom || !!urlTo || !!urlSearchValue
	);

	function updateParams(updates: Record<string, string | null>, replace = true) {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') url.searchParams.delete(key);
			else url.searchParams.set(key, value);
		}
		const href =
			`${page.url.pathname}?${url.searchParams.toString()}` as `${typeof page.url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: replace, noScroll: true, keepFocus: true });
	}

	const pagination = createUrlPagination({ defaultLimit: LIMIT, total: () => listTotal });

	// ── Local state ─────────────────────────────────────────────────────────
	let summary = $state<TransactionSummary | null>(null);
	let summaryLoading = $state(true);
	let listData = $state<PayinTransaction[]>([]);
	let listTotal = $state(0);
	let listLoading = $state(true);

	let searchField = $state(urlSearchField);
	let searchInput = $state(urlSearchValue);

	let drawerOpen = $state(false);
	let drawerLoading = $state(false);
	let drawerNotFound = $state(false);
	let selectedTransaction = $state<PayinTransaction | null>(null);
	let auditEvents = $state<AuditEvent[]>([]);

	let refundModalOpen = $state(false);
	let refundTarget = $state<PayinTransaction | null>(null);
	let refreshKey = $state(0);

	// ── Fetch summary ───────────────────────────────────────────────────────
	let summaryRequestId = 0;
	$effect(() => {
		const merchantId = urlMerchantId;
		summaryLoading = true;
		const id = ++summaryRequestId;
		void refreshKey;
		getTransactionSummary(merchantId).then((s) => {
			if (id !== summaryRequestId) return;
			summary = s;
			summaryLoading = false;
		});
	});

	// ── Fetch list ──────────────────────────────────────────────────────────
	let listRequestId = 0;
	$effect(() => {
		listLoading = true;
		const id = ++listRequestId;
		void refreshKey;
		getTransactionList({
			merchantId: urlMerchantId,
			searchField: urlSearchField as 'crn' | 'clientOrderId' | 'utr',
			searchValue: urlSearchValue,
			type: urlType,
			status: urlStatus,
			from: dateInvalid ? undefined : urlFrom,
			to: dateInvalid ? undefined : urlTo,
			skip: pagination.skip,
			limit: pagination.limit
		}).then((r) => {
			if (id !== listRequestId) return;
			listData = r.data;
			listTotal = r.total;
			listLoading = false;
		});
	});

	// ── Debounced search ────────────────────────────────────────────────────
	const debouncedSearch = debounce((val: string) => {
		if (val !== urlSearchValue) updateParams({ search: val || null, skip: '0' });
	}, 350);

	$effect(() => {
		debouncedSearch(searchInput);
	});

	function handleSearch(newField: string, newValue: string) {
		if (newField !== urlSearchField) {
			updateParams({ field: newField, search: null, skip: '0' });
			searchInput = '';
		} else {
			searchInput = newValue;
		}
	}

	// ── Filter handlers ─────────────────────────────────────────────────────
	function setMerchant(id: string) {
		updateParams({ merchant: id, skip: '0' });
	}
	function setType(v: string) {
		updateParams({ type: v || null, skip: '0' });
	}
	function setStatus(v: string) {
		updateParams({ status: v || null, skip: '0' });
	}
	function setDateRange(from: string | null, to: string | null) {
		updateParams({ from, to, skip: '0' });
	}
	function resetFilters() {
		searchInput = '';
		searchField = 'crn';
		updateParams({
			type: null,
			status: null,
			from: null,
			to: null,
			search: null,
			field: null,
			skip: '0'
		});
	}

	// ── Drawer ──────────────────────────────────────────────────────────────
	async function openTransaction(row: PayinTransaction) {
		drawerOpen = true;
		drawerLoading = true;
		drawerNotFound = false;
		selectedTransaction = null;
		auditEvents = [];
		const [txn, events] = await Promise.all([
			getTransactionById(row.id, urlMerchantId),
			getAuditHistory(row.id, urlMerchantId)
		]);
		if (!txn) {
			drawerNotFound = true;
		} else {
			selectedTransaction = txn;
			auditEvents = events;
		}
		drawerLoading = false;
	}

	function handleRefund(t: PayinTransaction) {
		refundTarget = t;
		refundModalOpen = true;
	}

	async function confirmRefund(amount: number, remarks: string) {
		if (!refundTarget) return;
		recordRefundInitiated(refundTarget.id, amount, remarks);
		refundModalOpen = false;
		toast.success(`Refund of ${amount.toLocaleString('en-IN')} initiated`, {
			description: `Transaction ${refundTarget.id}`
		});
		refreshKey += 1;
		if (selectedTransaction && selectedTransaction.id === refundTarget.id) {
			const [txn, events] = await Promise.all([
				getTransactionById(refundTarget.id, urlMerchantId),
				getAuditHistory(refundTarget.id, urlMerchantId)
			]);
			selectedTransaction = txn;
			auditEvents = events;
		}
	}
</script>

<div class="flex flex-col gap-5">
	<div>
		<h1 class="text-lg font-semibold text-foreground">Transactions</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Showing PayIn transactions for
			<span class="font-medium text-foreground">{selectedMerchant?.name ?? '—'}</span>
		</p>
	</div>

	<PayinInsightCards
		availableFunds={summary?.availableFunds ?? 0}
		todayVolume={summary?.todayVolume ?? 0}
		todayCount={summary?.todayCount ?? 0}
		loading={summaryLoading}
	/>

	<PayinFiltersToolbar
		{merchants}
		merchantId={urlMerchantId}
		onMerchantChange={setMerchant}
		type={urlType}
		onTypeChange={setType}
		status={urlStatus}
		onStatusChange={setStatus}
		from={urlFrom}
		to={urlTo}
		onDateApply={setDateRange}
		{dateInvalid}
		bind:searchField
		bind:searchValue={searchInput}
		onSearch={handleSearch}
		onReset={resetFilters}
	/>

	{#if !listLoading && listTotal === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card py-20 text-center shadow-sm"
		>
			{#if hasActiveFilters}
				<p class="text-sm font-medium text-muted-foreground">
					{urlSearchValue
						? 'No results match your search'
						: 'No transactions match the selected filters'}
				</p>
				<p class="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
				<button
					onclick={resetFilters}
					class="mt-1 flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
				>
					<RotateCcw class="h-3.5 w-3.5" /> Reset filters
				</button>
			{:else}
				<p class="text-sm font-medium text-muted-foreground">No transactions yet</p>
				<p class="text-xs text-muted-foreground/60">
					Transactions for this merchant will appear here once received.
				</p>
			{/if}
		</div>
	{:else}
		<PayinTransactionsTable
			data={listData}
			loading={listLoading}
			pageNumber={pagination.currentPage}
			totalPages={pagination.pageCount}
			setPageNumber={pagination.setPage}
			onView={openTransaction}
		/>
	{/if}
</div>

<PayinTransactionDrawer
	bind:open={drawerOpen}
	transaction={selectedTransaction}
	{auditEvents}
	loading={drawerLoading}
	notFound={drawerNotFound}
	onRefund={handleRefund}
/>

<RefundModal bind:open={refundModalOpen} transaction={refundTarget} onConfirm={confirmRefund} />
