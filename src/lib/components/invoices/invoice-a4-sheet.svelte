<script lang="ts">
	import InvoiceBill from './invoice-bill.svelte';
	import type { Invoice } from '$lib/types/invoice';
	import { cn } from '$lib/utils';

	let {
		invoice,
		issuerName = '',
		issuerGstin = '',
		class: className
	}: {
		invoice: Invoice;
		issuerName?: string;
		issuerGstin?: string;
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
		customerAddress={invoice.customerAddress}
		dueDate={invoice.dueDate}
		issuedDate={invoice.createdAt.slice(0, 10)}
		description={invoice.description}
		amount={invoice.amount}
		items={invoice.items ?? []}
		{issuerName}
		{issuerGstin}
		class="flex-1"
	/>
</div>
