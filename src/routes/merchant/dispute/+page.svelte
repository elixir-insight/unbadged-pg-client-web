<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ColumnDef } from '@tanstack/table-core';
	import { SvelteURL } from 'svelte/reactivity';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Dropdown, Table, createUrlPagination } from '$lib/components/reusable';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import { X } from '$lib/assets/icons';
	import { DISPUTE_SOURCE_FILTERS } from '$lib/utils/dispute-status';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type DisputeRow = PageData['disputes'][number];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});
	const sourceFilter = $derived(page.url.searchParams.get('source') ?? '');

	const sourceOptions = DISPUTE_SOURCE_FILTERS.map((option) => ({
		value: option.value,
		label: option.label
	}));

	const columns = $derived<ColumnDef<DisputeRow>[]>([
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
	]);

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

	function onSourceChange(value: string): void {
		updateParams({ source: value || null, skip: null });
	}

	function removeFilter(key: 'source'): void {
		updateParams({ [key]: null, skip: null });
	}

	function clearAllFilters(): void {
		updateParams({ source: null, skip: null });
	}

	function openDispute(disputeId: string): void {
		goto(resolve('/merchant/dispute/[disputeId]', { disputeId }));
	}

	function openDisputeRow(dispute: DisputeRow): void {
		openDispute(dispute.disputeId);
	}

	function getRowAriaLabel(dispute: DisputeRow): string {
		return `View dispute ${dispute.disputeId}`;
	}

	const activeFilters = $derived.by(() => {
		const filters: { key: 'source'; label: string; value: string }[] = [];
		if (sourceFilter) {
			const option = sourceOptions.find((item) => item.value === sourceFilter);
			filters.push({ key: 'source', label: 'Source', value: option?.label ?? sourceFilter });
		}
		return filters;
	});
</script>

<section class="flex flex-col gap-4">
	<div>
		<h1 class="text-lg font-semibold text-foreground">Disputes</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Review payment disputes and submit merchant proof documents.
		</p>
	</div>

	{#if data.listError}
		<p class="text-sm text-destructive">{data.listError}</p>
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<div class="w-full sm:w-56">
			<Dropdown
				value={sourceFilter || undefined}
				options={sourceOptions}
				placeholder="Source"
				ariaLabel="Filter by source"
				onValueChange={onSourceChange}
			/>
		</div>
	</div>

	{#if activeFilters.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			{#each activeFilters as filter (filter.key)}
				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
					onclick={() => removeFilter(filter.key)}
				>
					<span class="text-muted-foreground">{filter.label}:</span>
					{filter.value}
					<X class="size-3.5 text-muted-foreground" />
				</button>
			{/each}
			<button
				type="button"
				class="text-xs font-medium text-primary hover:underline"
				onclick={clearAllFilters}
			>
				Clear all
			</button>
		</div>
	{/if}

	<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
		{#if data.disputes.length > 0}
			<Table
				data={data.disputes}
				{columns}
				pageNumber={pagination.pageNumber}
				totalPages={pagination.totalPages}
				setPageNumber={pagination.setPageNumber}
				variant="borderless"
				onRowClick={openDisputeRow}
				{getRowAriaLabel}
			/>
		{:else}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No disputes available</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{#if activeFilters.length > 0}
						Try clearing filters to see more results.
					{:else}
						Disputes raised for your transactions will appear here.
					{/if}
				</p>
			</div>
		{/if}
	</div>
</section>
