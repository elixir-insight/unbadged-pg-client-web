<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { goto } from '$app/navigation';
	import { navigating, page as pageState } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURL } from 'svelte/reactivity';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import Drawer from '$lib/components/reusable/drawer/drawer.svelte';
	import { X } from '$lib/assets/icons';
	import {
		Button,
		Dropdown,
		CardData,
		SearchWithDropdown,
		Chip,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { CommissionRecord } from './types';
	import { getRuleBreakdown } from './rule-breakdown';

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

	const selectedDate = $derived(pageState.url.searchParams.get('date') ?? '');
	const selectedMerchant = $derived(pageState.url.searchParams.get('merchant') ?? undefined);

	const pagination = createUrlPagination({
		defaultLimit: 8,
		total: () => data.commissions.total
	});

	const pageRows = $derived(
		data.commissions.records.slice(pagination.skip, pagination.skip + pagination.limit)
	);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const hasActiveFilters = $derived(Boolean(selectedDate || selectedMerchant));

	const dateOptions = $derived([
		{ value: '', label: 'All dates' },
		...data.commissions.availableDates.map((date) => ({
			value: date,
			label: formatDate(date)
		}))
	]);

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

	const drawerDateLabel = $derived(selectedDate ? formatDate(selectedDate) : 'All dates');

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

	function setFilters(updates: { date?: string; merchant?: string }) {
		const url = new SvelteURL(pageState.url.toString());

		if ('date' in updates) {
			if (updates.date) url.searchParams.set('date', updates.date);
			else url.searchParams.delete('date');
		}

		if ('merchant' in updates) {
			if (updates.merchant) url.searchParams.set('merchant', updates.merchant);
			else url.searchParams.delete('merchant');
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

	function handleDateChange(value: string) {
		setFilters({ date: value });
	}

	function handleMerchantChange(value: string) {
		setFilters({ merchant: value === 'all' ? '' : value });
	}

	function clearFilters() {
		setFilters({ date: '', merchant: '' });
	}

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
			}
		);

		if (!selectedDate) {
			cols.push({
				accessorKey: 'date',
				header: 'Date',
				meta: { align: 'right' },
				cell: (info) => renderSnippet(textCell, { value: formatDate(info.getValue<string>()) })
			});
		}

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

	<div class="flex flex-wrap items-end gap-3">
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Date</span>
			<Dropdown
				value={selectedDate}
				options={dateOptions}
				onValueChange={handleDateChange}
				size="sm"
				class="w-44"
			/>
		</div>

		<div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
			<span class="text-xs font-medium text-muted-foreground">Merchant</span>
			<SearchWithDropdown
				value={selectedMerchantValue}
				options={merchantOptions}
				placeholder="All merchants"
				onValueChange={handleMerchantChange}
				size="sm"
			/>
		</div>

		{#if hasActiveFilters}
			<Button size="sm" variant="ghost" onclick={clearFilters}>Clear filters</Button>
		{/if}
	</div>

	<div class="rounded-lg border border-border bg-card shadow-2xl">
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
							Try a different date or merchant filter.
						{:else}
							Commission transactions will appear here once merchants start processing.
						{/if}
					</p>
				</div>
				{#if hasActiveFilters}
					<Button size="sm" variant="outline" onclick={clearFilters}>Clear filters</Button>
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
								<td class="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap"
									>{row.ratePercent}%</td
								>
								<td class="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap"
									>{currency.format(row.volume)}</td
								>
								<td class="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap"
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
								<td class="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap"
									>{currency.format(drawerTotalVolume)}</td
								>
								<td
									class="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap text-primary"
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
