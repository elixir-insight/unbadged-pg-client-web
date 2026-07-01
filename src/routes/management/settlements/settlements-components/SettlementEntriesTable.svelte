<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { SettlementEntry } from '$lib/data/partnerSettlementsDummyData';
	import { formatInrDetailed, formatRecordDate } from '$lib/data/partnerSettlementsDummyData';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import { Button } from '$lib/components/ui/button';
	import { PencilIcon, Trash2Icon } from '$lib/assets/icons';

	let {
		entries,
		onEdit,
		onDelete
	}: {
		entries: SettlementEntry[];
		onEdit?: (entry: SettlementEntry) => void;
		onDelete?: (entry: SettlementEntry) => void;
	} = $props();

	const columns: ColumnDef<SettlementEntry>[] = [
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
			header: 'UTR',
			cell: ({ row }) => row.original.utr
		},
		{
			id: 'actions',
			header: '',
			cell: ({ row }) => renderSnippet(actionsCell, { entry: row.original })
		}
	];

	function handleEdit(event: MouseEvent, entry: SettlementEntry) {
		event.stopPropagation();
		onEdit?.(entry);
	}

	function handleDelete(event: MouseEvent, entry: SettlementEntry) {
		event.stopPropagation();
		onDelete?.(entry);
	}
</script>

{#snippet amountCell({ amount }: { amount: number })}
	<span class="font-semibold">{formatInrDetailed(amount)}</span>
{/snippet}

{#snippet actionsCell({ entry }: { entry: SettlementEntry })}
	<div class="flex items-center justify-end gap-1">
		<Button
			variant="ghost"
			size="icon-xs"
			class="text-muted-foreground hover:text-foreground"
			aria-label="Edit entry"
			onclick={(event) => handleEdit(event, entry)}
		>
			<PencilIcon class="size-4" />
		</Button>
		<Button
			variant="ghost"
			size="icon-xs"
			class="text-muted-foreground hover:text-destructive"
			aria-label="Delete entry"
			onclick={(event) => handleDelete(event, entry)}
		>
			<Trash2Icon class="size-4" />
		</Button>
	</div>
{/snippet}

<Table
	data={entries as unknown as Record<string, unknown>[]}
	columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
	pageNumber={1}
	setPageNumber={() => {}}
	totalPages={1}
	showingText="{entries.length} entries"
	variant="borderless"
/>
