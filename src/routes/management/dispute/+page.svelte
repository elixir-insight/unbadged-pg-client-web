<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ColumnDef } from '@tanstack/table-core';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Dropdown, Table, createUrlPagination } from '$lib/components/reusable';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import { X } from '$lib/assets/icons';
	import { DISPUTE_SOURCE_FILTERS, DISPUTE_STATUS_FILTERS } from '$lib/utils/dispute-status';
	import { getCurrentDisputeMerchantId, setDisputeMerchant } from './dispute-scope.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type DisputeRow = PageData['disputes'][number];

	const merchantId = $derived(getCurrentDisputeMerchantId(data.merchantOptions));
	const listPath = resolve('/management/dispute');
	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});
	const sourceFilter = $derived(page.url.searchParams.get('source') ?? '');

	const statusOptions = DISPUTE_STATUS_FILTERS.map((option) => ({
		value: option.value,
		label: option.label
	}));
	const sourceOptions = DISPUTE_SOURCE_FILTERS.map((option) => ({
		value: option.value,
		label: option.label
	}));

	const columns: ColumnDef<DisputeRow>[] = [
		{ accessorKey: 'disputeId', header: 'Dispute ID' },
		{ accessorKey: 'orderId', header: 'Order ID' },
		{ accessorKey: 'transactionId', header: 'Transaction ID' },
		{ accessorKey: 'amount', header: 'Amount' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderComponent(DisputeStatusBadge, { status: info.getValue<string>() })
		},
		{ accessorKey: 'raisedOn', header: 'Raised on' },
		{ accessorKey: 'evidenceDueBy', header: 'Evidence due by' }
	];

	function updateParams(updates: Record<string, string | null>): void {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	function onStatusChange(value: string): void {
		pagination.setStatus(value);
	}

	function onSourceChange(value: string): void {
		updateParams({ source: value || null, skip: null });
	}

	function removeFilter(key: 'status' | 'source'): void {
		if (key === 'status') pagination.setStatus('');
		else updateParams({ source: null, skip: null });
	}

	function clearAllFilters(): void {
		updateParams({ status: null, source: null, skip: null });
	}

	function openDispute(disputeId: string): void {
		const params = new SvelteURLSearchParams();
		if (merchantId) params.set('merchantId', merchantId);
		const detailPath = resolve('/management/dispute/[disputeId]', { disputeId });
		const href = params.size
			? (`${detailPath}?${params.toString()}` as `${typeof detailPath}?${string}`)
			: detailPath;
		goto(resolve(href as '/'));
	}

	function openDisputeRow(dispute: DisputeRow): void {
		openDispute(dispute.disputeId);
	}

	function getRowAriaLabel(dispute: DisputeRow): string {
		return `View dispute ${dispute.disputeId}`;
	}

	const activeFilters = $derived.by(() => {
		const filters: { key: 'status' | 'source'; label: string; value: string }[] = [];
		if (pagination.status) {
			const option = statusOptions.find((item) => item.value === pagination.status);
			filters.push({ key: 'status', label: 'Status', value: option?.label ?? pagination.status });
		}
		if (sourceFilter) {
			const option = sourceOptions.find((item) => item.value === sourceFilter);
			filters.push({ key: 'source', label: 'Source', value: option?.label ?? sourceFilter });
		}
		return filters;
	});
</script>

<section class="flex flex-col gap-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-lg font-semibold text-foreground">Disputes</h1>
			<p class="mt-1 text-sm text-muted-foreground">Review and manage payment disputes.</p>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<div class="w-full sm:w-64">
				<Dropdown
					value={merchantId}
					placeholder="Merchant"
					disabled={data.merchantOptions.length === 0}
					search={true}
					options={data.merchantOptions}
					onValueChange={(value) => setDisputeMerchant(value, listPath)}
				/>
			</div>
			<div class="w-full sm:w-50">
				<Dropdown
					value={pagination.status || undefined}
					placeholder="Status"
					options={statusOptions}
					onValueChange={onStatusChange}
				/>
			</div>
			<div class="w-full sm:w-50">
				<Dropdown
					value={sourceFilter || undefined}
					placeholder="Source"
					options={sourceOptions}
					onValueChange={onSourceChange}
				/>
			</div>
		</div>
		{#if data.merchantsError}
			<p class="text-xs text-destructive">Unable to load merchants. Please try again.</p>
		{:else if data.merchantOptions.length === 0}
			<p class="text-xs text-muted-foreground">No merchants are available.</p>
		{/if}

		{#if activeFilters.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				{#each activeFilters as filter (filter.key)}
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
						onclick={() => removeFilter(filter.key)}
					>
						<span>{filter.label}: {filter.value}</span>
						<X class="size-3" />
					</button>
				{/each}
				<button
					type="button"
					class="text-xs text-muted-foreground hover:text-foreground"
					onclick={clearAllFilters}
				>
					Clear filters
				</button>
			</div>
		{/if}
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
		{#if data.listError}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">Unable to load disputes</p>
				<p class="mt-1 text-xs text-destructive">{data.listError}</p>
			</div>
		{:else if data.disputes.length > 0}
			<Table
				data={data.disputes}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				variant="borderless"
				onRowClick={openDisputeRow}
				{getRowAriaLabel}
			/>
		{:else}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No disputes raised</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{activeFilters.length > 0
						? 'Try a different status or source filter.'
						: 'Raised disputes for this merchant will appear here.'}
				</p>
			</div>
		{/if}
	</div>
</section>
