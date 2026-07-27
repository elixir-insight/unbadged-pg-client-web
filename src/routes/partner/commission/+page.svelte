<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { goto } from '$app/navigation';
	import { navigating, page as pageState } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURL } from 'svelte/reactivity';
	import { getLocalTimeZone } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import Drawer from '$lib/components/reusable/drawer/drawer.svelte';
	import { Download, RefreshCw, X } from '$lib/assets/icons';
	import {
		Button,
		Chip,
		CardData,
		DateRangePicker,
		FilterCards,
		SearchField,
		SearchWithDropdown,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { CommissionPaymentMethod, CommissionRecord } from './types';
	import { getRuleBreakdown } from './rule-breakdown';
	import { debounce } from '$lib/utils/debounce.js';

	let { data } = $props();

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

	function formatDate(value: string) {
		return dateFormatter.format(new Date(value));
	}

	const selectedMerchant = $derived(pageState.url.searchParams.get('merchant') ?? undefined);
	const selectedPaymentMethod = $derived(pageState.url.searchParams.get('paymentMethod') ?? '');
	const searchField = $derived(
		pageState.url.searchParams.get('searchField') === 'merchant' ? 'merchant' : 'transactionRef'
	);

	const paymentMethodCards: { label: string; method: CommissionPaymentMethod | null }[] = [
		{ label: 'All Methods', method: null },
		{ label: 'UPI', method: 'UPI' },
		{ label: 'Card', method: 'Card' },
		{ label: 'NetBanking', method: 'NetBanking' },
		{ label: 'Wallet', method: 'Wallet' }
	];

	const searchFields = [
		{ value: 'transactionRef', label: 'Transaction Ref', placeholder: 'e.g. TXN-88412001…' },
		{ value: 'merchant', label: 'Merchant Name', placeholder: 'e.g. BlueCart Retail…' }
	];

	const pagination = createUrlPagination({
		defaultLimit: 8,
		total: () => data.commissions.total
	});

	let searchInput = $derived(pagination.search);

	$effect(() => {
		searchInput = pagination.search;
	});

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	const pageRows = $derived(
		data.commissions.records.slice(pagination.skip, pagination.skip + pagination.limit)
	);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	let dateRange = $state<DateRange>({ start: undefined, end: undefined });

	const hasActiveFilters = $derived(
		Boolean(
			(dateRange.start && dateRange.end) ||
			selectedMerchant ||
			selectedPaymentMethod ||
			pagination.search
		)
	);

	const merchantOptions = $derived([
		{ value: 'all', label: 'All merchants', description: 'Every referred merchant' },
		...data.commissions.merchants
	]);

	const selectedMerchantValue = $derived(selectedMerchant ?? 'all');

	const selectedMerchantLabel = $derived(
		data.commissions.merchants.find((merchant) => merchant.value === selectedMerchant)?.label ?? ''
	);

	let drawerOpen = $state(false);
	let drawerMerchantId = $state<string | undefined>(undefined);

	const drawerMerchant = $derived(
		data.commissions.merchants.find((merchant) => merchant.value === drawerMerchantId)
	);

	const drawerVolume = $derived(
		drawerMerchantId
			? data.commissions.records
					.filter((record) => record.merchantId === drawerMerchantId)
					.reduce((sum, record) => sum + record.volume, 0)
			: 0
	);

	const drawerBreakdown = $derived(
		drawerMerchantId ? getRuleBreakdown(drawerMerchantId, drawerVolume) : []
	);

	const drawerTotalVolume = $derived(drawerBreakdown.reduce((sum, row) => sum + row.volume, 0));

	const drawerTotalCommission = $derived(
		drawerBreakdown.reduce((sum, row) => sum + row.commission, 0)
	);

	const drawerDateLabel = $derived.by(() => {
		if (!dateRange.start || !dateRange.end) return 'All dates';
		const tz = getLocalTimeZone();
		const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
		return `${fmt(dateRange.start.toDate(tz))} – ${fmt(dateRange.end.toDate(tz))}`;
	});

	function merchantInitials(name: string) {
		return name
			.split(' ')
			.map((word) => word[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function openMerchantDrawer(record: CommissionRecord) {
		drawerMerchantId = record.merchantId;
		drawerOpen = true;
	}

	function setFilters(updates: Record<string, string | null>) {
		const url = new SvelteURL(pageState.url.toString());

		for (const [key, value] of Object.entries(updates)) {
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}

		url.searchParams.delete('skip');

		const href =
			`${pageState.url.pathname}?${url.searchParams.toString()}` as `${typeof pageState.url.pathname}?${string}`;

		goto(resolve(href as '/'), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function handleDateApply(value: DateRange) {
		if (value.start && value.end) {
			const tz = getLocalTimeZone();
			setFilters({
				dateFrom: value.start.toDate(tz).toISOString().slice(0, 10),
				dateTo: value.end.toDate(tz).toISOString().slice(0, 10)
			});
		} else {
			setFilters({ dateFrom: null, dateTo: null });
		}
	}

	function handleMerchantChange(value: string) {
		setFilters({ merchant: value === 'all' ? '' : value });
	}

	function selectPaymentMethodCard(label: string) {
		const card = paymentMethodCards.find((c) => c.label === label);
		setFilters({ paymentMethod: card?.method ?? '' });
	}

	function handleSearch(field: string, value: string) {
		searchInput = value;
		setFilters({ searchField: field === 'transactionRef' ? null : field });
		debouncedSearch(value);
	}

	function removeFilter(key: 'date' | 'merchant' | 'paymentMethod' | 'search') {
		if (key === 'date') {
			dateRange = { start: undefined, end: undefined };
			setFilters({ dateFrom: null, dateTo: null });
		} else if (key === 'merchant') {
			setFilters({ merchant: null });
		} else if (key === 'paymentMethod') {
			setFilters({ paymentMethod: null });
		} else if (key === 'search') {
			searchInput = '';
			setFilters({ search: null, searchField: null });
		}
	}

	function clearFilters() {
		dateRange = { start: undefined, end: undefined };
		searchInput = '';
		setFilters({
			dateFrom: null,
			dateTo: null,
			merchant: null,
			paymentMethod: null,
			search: null,
			searchField: null
		});
	}

	const activeFilters = $derived.by(() => {
		const filters: {
			key: 'date' | 'merchant' | 'paymentMethod' | 'search';
			label: string;
			value: string;
		}[] = [];

		if (dateRange.start && dateRange.end) {
			filters.push({ key: 'date', label: 'Date', value: drawerDateLabel });
		}

		if (selectedMerchant) {
			filters.push({ key: 'merchant', label: 'Merchant', value: selectedMerchantLabel });
		}

		if (selectedPaymentMethod) {
			filters.push({ key: 'paymentMethod', label: 'Method', value: selectedPaymentMethod });
		}

		if (pagination.search) {
			const opt = searchFields.find((f) => f.value === searchField);
			filters.push({ key: 'search', label: opt?.label ?? 'Search', value: pagination.search });
		}

		return filters;
	});

	const columns = $derived.by((): ColumnDef<CommissionRecord>[] => {
		const cols: ColumnDef<CommissionRecord>[] = [
			{
				accessorKey: 'transactionRef',
				header: 'Transaction Ref',
				meta: { align: 'left' },
				cell: (info) => renderSnippet(textCell, { value: info.getValue<string>() })
			}
		];

		if (!selectedMerchant) {
			cols.push({
				accessorKey: 'merchantName',
				header: 'Merchant',
				meta: { align: 'left' },
				cell: (info) => renderSnippet(merchantCell, info.row.original)
			});
		}

		cols.push(
			{
				accessorKey: 'paymentMethod',
				header: 'Method',
				meta: { align: 'left' },
				cell: (info) => renderSnippet(methodCell, { method: info.getValue<string>() })
			},
			{
				accessorKey: 'volume',
				header: () => renderSnippet(amountHeader, { label: 'Volume' }),
				meta: { align: 'right' },
				cell: (info) =>
					renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
			},
			{
				accessorKey: 'commission',
				header: () => renderSnippet(amountHeader, { label: 'Commission' }),
				meta: { align: 'right' },
				cell: (info) =>
					renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
			},
			{
				accessorKey: 'date',
				header: 'Date',
				meta: { align: 'right' },
				cell: (info) => renderSnippet(textCell, { value: formatDate(info.getValue<string>()) })
			}
		);

		return cols;
	});
</script>

{#snippet merchantCell(record: CommissionRecord)}
	<div class="flex min-w-0 items-center gap-2.5">
		<span
			class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary"
		>
			{record.merchantName
				.split(' ')
				.map((word) => word[0])
				.slice(0, 2)
				.join('')
				.toUpperCase()}
		</span>
		<span class="min-w-0 truncate font-medium text-foreground">{record.merchantName}</span>
	</div>
{/snippet}

{#snippet textCell({ value }: { value: string })}
	<span class="block truncate" title={value}>{value}</span>
{/snippet}

{#snippet methodCell({ method }: { method: string })}
	<Chip variant="secondary">{method}</Chip>
{/snippet}

{#snippet amountCell({ value }: { value: string })}
	<span class="block truncate font-mono tabular-nums" title={value}>{value}</span>
{/snippet}

{#snippet amountHeader({ label }: { label: string })}
	<span class="block truncate">{label}</span>
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Commission</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Daily commission earned across your referred merchants.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<CardData
			label="Total Volume"
			value={currency.format(data.commissions.summary.totalVolume)}
			subText="{data.commissions.summary.recordCount} transactions"
			loading={isLoading}
		/>
		<CardData
			label="Total Commission"
			value={currency.format(data.commissions.summary.totalCommission)}
			subText="For current filters"
			loading={isLoading}
		/>
		<CardData
			label="Effective Rate"
			value="{data.commissions.summary.effectiveRatePercent}%"
			subText="Blended across filtered rows"
			loading={isLoading}
		/>
		<CardData
			label="Merchants"
			value={String(selectedMerchant ? 1 : data.commissions.merchants.length)}
			subText={selectedMerchant ? selectedMerchantLabel : 'All referred merchants'}
			loading={isLoading}
		/>
	</div>

	<FilterCards
		loading={isLoading}
		skeletonCount={5}
		cards={paymentMethodCards.map((c) => ({
			label: c.label,
			count:
				c.method === null
					? data.commissions.paymentMethodCounts.all
					: data.commissions.paymentMethodCounts[c.method]
		}))}
		selected={paymentMethodCards.find((c) => c.method === (selectedPaymentMethod || null))?.label ??
			'All Methods'}
		onselect={selectPaymentMethodCard}
		class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
	/>

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-2">
				<DateRangePicker bind:value={dateRange} onApply={handleDateApply} />

				<div class="min-w-0 sm:w-64">
					<SearchWithDropdown
						value={selectedMerchantValue}
						options={merchantOptions}
						placeholder="All merchants"
						onValueChange={handleMerchantChange}
						size="sm"
					/>
				</div>
			</div>

			<div class="w-full max-w-xs">
				<SearchField
					fields={searchFields}
					field={searchField}
					value={searchInput}
					onSearch={handleSearch}
				/>
			</div>
		</div>

		{#if hasActiveFilters}
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
					onclick={clearFilters}
					class="text-sm font-medium text-primary hover:underline focus-visible:outline-none"
				>
					Clear All
				</button>
			</div>
		{/if}
	</div>

	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{pagination.showingText} transactions</span>
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

		{#if !isLoading && data.commissions.total === 0}
			<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
				<div
					class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10"
				>
					<svg
						class="size-5 text-muted-foreground/25"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-foreground">No commission records found</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{#if hasActiveFilters}
							Try adjusting your filters.
						{:else}
							Commission transactions will appear here once merchants start processing.
						{/if}
					</p>
				</div>
				{#if hasActiveFilters}
					<Button size="sm" variant="outline" onclick={clearFilters}>Clear All</Button>
				{/if}
			</div>
		{:else}
			<Table
				data={pageRows}
				{columns}
				pageNumber={pagination.currentPage}
				setPageNumber={pagination.setPage}
				totalPages={pagination.pageCount}
				variant="borderless"
				loading={isLoading}
				onRowClick={openMerchantDrawer}
			/>
		{/if}
	</div>
</div>

<Drawer
	bind:open={drawerOpen}
	direction="right"
	class="data-[vaul-drawer-direction=right]:sm:max-w-3xl"
>
	{#if drawerMerchant}
		<div class="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
			<div class="flex items-center gap-2.5">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
				>
					{merchantInitials(drawerMerchant.label)}
				</span>
				<div>
					<h2 class="text-base font-semibold text-foreground">{drawerMerchant.label}</h2>
					<p class="text-xs text-muted-foreground">{drawerDateLabel}</p>
				</div>
			</div>
			<button
				type="button"
				class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Close drawer"
				onclick={() => (drawerOpen = false)}
			>
				<X class="size-4" />
			</button>
		</div>

		<div class="space-y-4 pt-4">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Rule breakdown — {drawerDateLabel}
			</p>

			<div class="rounded-lg border border-border">
				<table class="w-full table-fixed text-sm">
					<colgroup>
						<col class="w-[38%]" />
						<col class="w-[14%]" />
						<col class="w-[24%]" />
						<col class="w-[24%]" />
					</colgroup>
					<thead>
						<tr class="border-b border-border text-xs text-muted-foreground uppercase">
							<th class="px-3 py-2.5 text-left font-medium">Slab</th>
							<th class="px-3 py-2.5 text-right font-medium">Rate</th>
							<th class="px-3 py-2.5 text-right font-medium">Volume</th>
							<th class="px-3 py-2.5 text-right font-medium">Commission</th>
						</tr>
					</thead>
					<tbody>
						{#each drawerBreakdown as row (row.slabLabel)}
							<tr class="border-b border-border/40 last:border-b-0">
								<td class="px-3 py-2.5 whitespace-nowrap text-foreground">{row.slabLabel}</td>
								<td class="px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums"
									>{row.ratePercent}%</td
								>
								<td class="px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums"
									>{currency.format(row.volume)}</td
								>
								<td class="px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums"
									>{currency.format(row.commission)}</td
								>
							</tr>
						{:else}
							<tr>
								<td class="px-3 py-6 text-center text-muted-foreground" colspan="4">
									No commission activity for this merchant.
								</td>
							</tr>
						{/each}
						{#if drawerBreakdown.length > 0}
							<tr class="border-t border-border bg-muted/30 font-semibold">
								<td class="px-3 py-2.5 text-foreground">Total</td>
								<td class="px-3 py-2.5"></td>
								<td class="px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums"
									>{currency.format(drawerTotalVolume)}</td
								>
								<td
									class="px-3 py-2.5 text-right font-mono whitespace-nowrap text-primary tabular-nums"
									>{currency.format(drawerTotalCommission)}</td
								>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</Drawer>
