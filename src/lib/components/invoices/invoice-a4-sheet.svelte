<script lang="ts">
	import InvoiceBill from './invoice-bill.svelte';
	import { mockInvoiceIssuer } from '$lib/data/invoices-mock';
	import type { Invoice } from '$lib/types/invoice';
	import { cn } from '$lib/utils';

	let {
		invoice,
		class: className
	}: {
		invoice: Invoice;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-card p-8 text-foreground shadow-xl sm:p-10 print:min-h-[297mm] print:w-[210mm] print:max-w-none print:p-0 print:shadow-none',
		className
	)}
>
	<InvoiceBill
		invoiceNumber={invoice.invoiceNumber}
		customerName={invoice.customerName}
		customerEmail={invoice.customerEmail}
		customerPhone={invoice.customerPhone}
		dueDate={invoice.dueDate}
		issuedDate={invoice.createdAt.slice(0, 10)}
		description={invoice.description}
		amount={invoice.amount}
		items={invoice.items ?? []}
		issuerName={mockInvoiceIssuer.brandName}
		issuerAddress={mockInvoiceIssuer.address}
		issuerGstin={mockInvoiceIssuer.gstin}
		class="flex-1"
	/>
</div>
