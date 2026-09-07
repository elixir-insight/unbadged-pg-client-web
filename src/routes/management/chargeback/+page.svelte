<script lang="ts">
	import { createRawSnippet } from 'svelte';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Chip, Table, createUrlPagination } from '$lib/components/reusable';
	import { renderComponent } from '$lib/components/ui/data-table';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import type { PageData } from './$types';

	const CHARGEBACK_RATIO_WARNING_THRESHOLD = 0.7;

	function parseChargebackRatio(value: string): number {
		return Number.parseFloat(value);
	}

	function chargebackRatioChipVariant(value: string): BadgeVariant {
		const ratio = parseChargebackRatio(value);
		if (!Number.isFinite(ratio)) return 'secondary';
		return ratio > CHARGEBACK_RATIO_WARNING_THRESHOLD ? 'warning' : 'success';
	}

	let { data }: { data: PageData } = $props();

	type ChargebackRow = PageData['rows'][number];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	const columns: ColumnDef<ChargebackRow>[] = [
		{ accessorKey: 'orgId', header: 'Org ID' },
		{ accessorKey: 'overallAmount', header: 'Overall amount' },
		{ accessorKey: 'principalAmount', header: 'Principal amount' },
		{
			accessorKey: 'chargebackRatio',
			header: 'Chargeback ratio',
			cell: ({ row }) => {
				const label = row.original.chargebackRatio;
				const variant = chargebackRatioChipVariant(label);
				const children = createRawSnippet(() => ({ render: () => label }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];
</script>

<section class="flex flex-col gap-4">
	<div>
		<h1 class="text-lg font-semibold text-foreground">Chargeback</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Review chargebacks raised from payment disputes.
		</p>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
		{#if data.listError}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">Unable to load chargebacks</p>
				<p class="mt-1 text-xs text-destructive">{data.listError}</p>
			</div>
		{:else if data.rows.length > 0}
			<Table
				data={data.rows}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				variant="borderless"
			/>
		{:else}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No chargebacks yet</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Chargebacks raised from a dispute will appear here.
				</p>
			</div>
		{/if}
	</div>
</section>
