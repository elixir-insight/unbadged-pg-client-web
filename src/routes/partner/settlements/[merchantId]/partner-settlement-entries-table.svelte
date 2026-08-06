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
			header: () => renderSnippet(amountHeader, { label: 'Amount (INR)' }),
			meta: { align: 'right' },
			cell: ({ row }) =>
				renderSnippet(amountCell, { value: formatInrDetailed(row.original.amount) })
		},
		{
			accessorKey: 'tds',
			header: () => renderSnippet(amountHeader, { label: 'TDS 5%' }),
			meta: { align: 'right' },
			cell: ({ row }) => renderSnippet(amountCell, { value: formatInrDetailed(row.original.tds) })
		},
		{
			accessorKey: 'gst',
			header: () => renderSnippet(amountHeader, { label: 'GST 18%' }),
			meta: { align: 'right' },
			cell: ({ row }) => renderSnippet(amountCell, { value: formatInrDetailed(row.original.gst) })
		},
		{
			accessorKey: 'accountNumber',
			header: 'Account no.',
			cell: ({ row }) => renderSnippet(textCell, { value: row.original.accountNumber })
		},
		{
			accessorKey: 'ifsc',
			header: 'IFSC',
			cell: ({ row }) => renderSnippet(textCell, { value: row.original.ifsc })
		},
		{
			accessorKey: 'utr',
			header: 'UTR',
			cell: ({ row }) => renderSnippet(textCell, { value: row.original.utr })
		}
	];
</script>

{#snippet textCell({ value }: { value: string })}
	<span class="block truncate" title={value}>{value}</span>
{/snippet}

{#snippet amountCell({ value }: { value: string })}
	<span class="block truncate font-mono tabular-nums" title={value}>{value}</span>
{/snippet}

{#snippet amountHeader({ label }: { label: string })}
	<span class="block truncate">{label}</span>
{/snippet}

<Table
	data={entries}
	{columns}
	pageNumber={1}
	setPageNumber={() => {}}
	totalPages={1}
	variant="borderless"
	{loading}
/>
