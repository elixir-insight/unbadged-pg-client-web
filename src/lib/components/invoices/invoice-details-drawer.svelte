<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { Details, type DetailSection } from '$lib/components/transactions/collections';
	import InvoiceA4Sheet from './invoice-a4-sheet.svelte';
	import InvoiceStatusBadge from './invoice-status-badge.svelte';
	import type { Invoice } from '$lib/types/invoice';
	import {
		formatInvoiceAmount,
		formatInvoiceDateTime,
		formatInvoiceDueDate
	} from '$lib/utils/invoices-store';

	let {
		invoice,
		onCancel,
		onPrint
	}: {
		invoice: Invoice;
		onCancel?: (invoice: Invoice) => void;
		onPrint?: (invoice: Invoice) => void;
	} = $props();

	const canCancel = $derived(
		invoice.status === 'issued' || invoice.status === 'attempted' || invoice.status === 'overdue'
	);

	const sections = $derived<DetailSection[]>([
		{
			title: 'Invoice',
			rows: [
				{ label: 'Invoice number', value: invoice.invoiceNumber, bold: true },
				{ label: 'Description', value: invoice.description },
				{ label: 'Amount', value: formatInvoiceAmount(invoice.amount), bold: true },
				{ label: 'Due date', value: formatInvoiceDueDate(invoice.dueDate) },
				{
					label: 'Payment link',
					value: invoice.paymentLinkUrl ?? '—',
					copyable: Boolean(invoice.paymentLinkUrl),
					mono: true
				},
				...(invoice.transactionId
					? [{ label: 'Transaction ID', value: invoice.transactionId, copyable: true, mono: true }]
					: [])
			]
		},
		{
			title: 'Customer',
			rows: [
				{ label: 'Name', value: invoice.customerName },
				{ label: 'Email', value: invoice.customerEmail, mono: true },
				{ label: 'Phone', value: invoice.customerPhone, mono: true }
			]
		},
		{
			title: 'Metadata',
			rows: [
				{ label: 'Invoice ID', value: invoice.id, copyable: true, mono: true },
				{ label: 'Receipt No.', value: invoice.receiptNo, mono: true },
				{ label: 'Created By', value: invoice.createdBy },
				{ label: 'Created At', value: formatInvoiceDateTime(invoice.createdAt) }
			]
		}
	]);
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Status</span>
			<InvoiceStatusBadge status={invoice.status} />
		</div>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="outline"
				onclick={() => onPrint?.(invoice)}
				aria-label="Download invoice PDF"
			>
				Download PDF
			</Button>
			{#if canCancel}
				<Button variant="destructive" onclick={() => onCancel?.(invoice)}>Cancel invoice</Button>
			{/if}
		</div>
	</div>

	<div class="overflow-x-auto bg-muted p-4 print:bg-transparent print:p-0">
		<div class="mx-auto w-fit max-w-full">
			<InvoiceA4Sheet {invoice} />
		</div>
	</div>

	<div class="print:hidden">
		<Details {sections} flat />
	</div>
</div>
