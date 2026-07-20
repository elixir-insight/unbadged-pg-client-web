<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		SearchField,
		Dropdown,
		Avatar,
		createUrlPagination
	} from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { X } from '$lib/assets/icons';
	import { debounce } from '$lib/utils/debounce.js';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import SettlementStatusBadge from '../settlement-status-badge.svelte';
	import TransactionTypeBadge from './transaction-type-badge.svelte';
	import StatePanel from '../state-panel.svelte';
	import MonoCell from './mono-cell.svelte';
	import AmountCell from './amount-cell.svelte';
	import type { TransactionType } from '../types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const s = $derived(data.settlement);

	function backToList() {
		const params = new SvelteURLSearchParams();
		const date = page.url.searchParams.get('date');
		if (date) params.set('date', date);
		const merchant = page.url.searchParams.get('merchantId');
		if (merchant) params.set('merchantId', merchant);
		const tab = page.url.searchParams.get('tab');
		if (tab) params.set('tab', tab);
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

	// Server-driven pagination for settlement detail rows.
	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.detailsPagination.total
	});

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

	const paymentModeCounts = $derived.by(() => {
		const counts: { mode: string; count: number }[] = [];
		for (const t of s.transactions) {
			const existing = counts.find((c) => c.mode === t.paymentMode);
			if (existing) existing.count += 1;
			else counts.push({ mode: t.paymentMode, count: 1 });
		}
		return counts;
	});
	const paymentModeOptions = $derived(
		paymentModeCounts.map((c) => ({ value: c.mode, label: c.mode }))
	);

	const searchFieldParam = $derived(page.url.searchParams.get('searchField') || 'transactionId');

	function setSearchField(value: string) {
		const url = new SvelteURL(page.url.toString());
		if (value && value !== 'transactionId') url.searchParams.set('searchField', value);
		else url.searchParams.delete('searchField');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	// Search / pipeline filter apply to the current server page only (details API
	// documents page + limit only).
	const filteredTransactions = $derived.by(() => {
		let transactions = s.transactions;
		if (paymentModeParam) {
			transactions = transactions.filter((t) => t.paymentMode === paymentModeParam);
		}
		if (!pagination.search) return transactions;
		const q = pagination.search.toLowerCase();
		return transactions.filter((t) =>
			(searchFieldParam === 'orderId' ? t.orderId : t.transactionId).toLowerCase().includes(q)
		);
	});

	let searchInput = $derived(pagination.search);
	$effect(() => {
		searchInput = pagination.search;
	});
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearch(field: string, value: string) {
		if (field !== searchFieldParam) setSearchField(field);
		debouncedSearch(value);
	}

	const activeFilters = $derived.by(() => {
		const filters: { key: 'mode' | 'search'; label: string; value: string }[] = [];
		if (paymentModeParam) {
			filters.push({ key: 'mode', label: 'Pipeline', value: paymentModeParam });
		}
		if (pagination.search) {
			const label = searchFieldParam === 'orderId' ? 'Order ID' : 'Transaction ID';
			filters.push({ key: 'search', label, value: pagination.search });
		}
		return filters;
	});

	function removeFilter(key: 'mode' | 'search') {
		if (key === 'mode') setPaymentMode('');
		else pagination.setSearch('');
	}

	function clearAllFilters() {
		const url = new SvelteURL(page.url.toString());
		url.searchParams.delete('mode');
		url.searchParams.delete('search');
		url.searchParams.delete('skip');
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
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
		filteredTransactions.map((t) => ({
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
		{ accessorKey: 'paymentMode', header: 'Pipeline' }
	];

	function goToTransaction(row: TransactionDisplayRow) {
		goto(
			resolve('/management/transactions/collections/payments/[txnId]', {
				txnId: row.transactionId
			})
		);
	}

	function rowAriaLabel(row: TransactionDisplayRow): string {
		return `View transaction ${row.transactionId}`;
	}

	const showingText = $derived(
		data.detailsError
			? 'Unable to load settlement transactions'
			: `${pagination.showingText} transactions`
	);
</script>

<div class="flex flex-col gap-6">
	<div class="rounded-xl border border-border bg-card shadow-sm">
		<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
			<div class="flex items-center gap-3">
				<Avatar name={s.merchantName} shape="circle" size="lg" />
				<div>
					<p class="text-lg font-semibold text-foreground">{s.merchantName}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">
						<span class="font-mono">{s.settlementId}</span>
						<span class="mx-1">·</span>
						{s.settlementDatetime ? datetimeFormatter.format(new Date(s.settlementDatetime)) : '—'}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<SettlementStatusBadge status={s.status} />
				<button
					type="button"
					onclick={backToList}
					class="text-sm font-medium text-primary hover:underline focus-visible:outline-none"
				>
					Back
				</button>
			</div>
		</div>

		<div class="border-t border-border"></div>

		<div class="grid grid-cols-2 gap-x-4 gap-y-4 p-4 sm:grid-cols-4 sm:p-6">
			<div class="min-w-0">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Bank Reference
				</p>
				<p class="mt-1 font-mono text-sm font-medium break-all text-foreground">
					{s.bankReference}
				</p>
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Sale Amount</p>
				<p class="mt-1 text-sm font-medium text-foreground">{currency.format(s.saleAmount)}</p>
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Deductions</p>
				<p class="mt-1 text-sm font-medium text-destructive">{currency.format(s.deductions)}</p>
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Net Payout</p>
				<p class="mt-1 text-sm font-medium text-success">{currency.format(s.netPayout)}</p>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-start gap-2 sm:items-center">
			<div class="w-full sm:w-44">
				<Dropdown
					value={paymentModeParam || undefined}
					options={paymentModeOptions}
					placeholder="Pipeline"
					onValueChange={(value) => setPaymentMode(value)}
				/>
			</div>
			<div class="w-full sm:w-auto sm:max-w-xs">
				<SearchField
					fields={[
						{
							value: 'transactionId',
							label: 'Transaction ID',
							placeholder: 'e.g. payin attempt id…'
						},
						{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-…' }
					]}
					field={searchFieldParam}
					value={searchInput}
					onSearch={handleSearch}
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

	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
		</div>

		{#if data.detailsError}
			<StatePanel
				title="Couldn't load settlement transactions"
				description={data.detailsError}
				actionLabel="Back to Settlements"
				onAction={backToList}
			/>
		{:else if filteredTransactions.length === 0}
			{#if pagination.search}
				{@const fieldLabel = searchFieldParam === 'orderId' ? 'Order ID' : 'Transaction ID'}
				<StatePanel
					title="No transactions found"
					description={`No transactions match "${pagination.search}" in ${fieldLabel} on this page.`}
				/>
			{:else if paymentModeParam}
				<StatePanel
					title="No transactions found"
					description={`No transactions match the "${paymentModeParam}" pipeline on this page.`}
					actionLabel="Clear filter"
					onAction={() => setPaymentMode('')}
				/>
			{:else}
				<StatePanel
					title="No transactions found"
					description="This settlement has no transaction breakdown rows."
				/>
			{/if}
		{:else}
			<Table
				data={displayRows}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				onRowClick={goToTransaction}
				getRowAriaLabel={rowAriaLabel}
				variant="borderless"
			/>
		{/if}
	</div>
</div>
