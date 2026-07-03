<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { PartnerSettlementEntry } from './types';
	import { formatInrDetailed, formatRecordDate } from './shared';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';

	let {
		entries,
		loading = false
	}: {
		entries: PartnerSettlementEntry[];
		loading?: boolean;
	} = $props();

	const columns: ColumnDef<PartnerSettlementEntry>[] = [
		{
			accessorKey: 'date',
			header: 'Date',
			cell: ({ row }) => formatRecordDate(row.original.date)
		},
		{
			accessorKey: 'amount',
			header: 'Amount (INR)',
			cell: ({ row }) => renderSnippet(amountCell, { amount: row.original.amount })
		},
		{
			accessorKey: 'tds',
			header: 'TDS 5%',
			cell: ({ row }) => formatInrDetailed(row.original.tds)
		},
		{
			accessorKey: 'gst',
			header: 'GST 18%',
			cell: ({ row }) => formatInrDetailed(row.original.gst)
		},
		{
			accessorKey: 'accountNumber',
			header: 'Account no.'
		},
		{
			accessorKey: 'ifsc',
			header: 'IFSC'
		},
		{
			accessorKey: 'utr',
			header: 'UTR'
		}
	];
</script>

{#snippet amountCell({ amount }: { amount: number })}
	<span class="font-semibold">{formatInrDetailed(amount)}</span>
{/snippet}

<Table
	data={entries}
	{columns}
	pageNumber={1}
	setPageNumber={() => {}}
	totalPages={1}
	variant="borderless"
	{loading}
	caption="Settlement entries"
/>
