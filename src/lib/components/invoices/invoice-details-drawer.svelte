<script lang="ts">
	import { Details, type DetailSection } from '$lib/components/transactions/collections';
	import InvoiceStatusBadge from './invoice-status-badge.svelte';
	import type { Invoice } from '$lib/types/invoice';
	import {
		formatInvoiceAmount,
		formatInvoiceDateTime,
		formatInvoiceDueDate
	} from '$lib/utils/invoices-store';

	let { invoice }: { invoice: Invoice } = $props();

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
	<div class="flex items-center gap-2">
		<span class="text-sm text-muted-foreground">Status</span>
		<InvoiceStatusBadge status={invoice.status} />
	</div>

	<Details {sections} flat />
</div>
