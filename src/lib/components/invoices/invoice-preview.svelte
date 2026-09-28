<script lang="ts">
	import InvoiceBill from './invoice-bill.svelte';
	import type { InvoiceLineItem } from '$lib/types/invoice';

	let {
		invoiceNumber = '',
		customerName = '',
		customerEmail = '',
		customerPhone = '',
		dueDate = '',
		issuedDate = '',
		description = '',
		amount = 0,
		items = [],
		issuerName = '',
		issuerAddress = '',
		issuerGstin = ''
	}: {
		invoiceNumber?: string;
		customerName?: string;
		customerEmail?: string;
		customerPhone?: string;
		dueDate?: string;
		issuedDate?: string;
		description?: string;
		amount?: number;
		items?: InvoiceLineItem[];
		issuerName?: string;
		issuerAddress?: string;
		issuerGstin?: string;
	} = $props();
</script>

<div
	class="flex max-h-[calc(100vh-10rem)] justify-center overflow-auto rounded-xl bg-muted px-3 py-4 sm:px-5"
>
	<div
		class="flex aspect-[210/297] w-full max-w-[210mm] flex-col bg-card p-5 shadow-xl sm:p-6 print:aspect-auto print:min-h-[297mm] print:max-w-none print:p-10 print:shadow-none"
	>
		<InvoiceBill
			{invoiceNumber}
			{customerName}
			{customerEmail}
			{customerPhone}
			{dueDate}
			{issuedDate}
			{description}
			{amount}
			{items}
			{issuerName}
			{issuerAddress}
			{issuerGstin}
			class="flex-1"
		/>
	</div>
</div>
