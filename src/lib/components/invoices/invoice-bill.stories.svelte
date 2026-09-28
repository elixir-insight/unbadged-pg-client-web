<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import InvoiceBill from './invoice-bill.svelte';
	import { mockInvoiceIssuer } from '$lib/data/invoices-mock';

	const { Story } = defineMeta({
		title: 'Invoices/InvoiceBill',
		component: InvoiceBill,
		tags: ['autodocs']
	});
</script>

<Story name="Filled">
	{#snippet template()}
		<div class="max-w-2xl bg-muted p-6">
			<div class="min-h-[297mm] max-w-[210mm] bg-card p-10 shadow-xl">
				<InvoiceBill
					invoiceNumber="INV-202609-0001"
					customerName="Brightstone Industries"
					customerEmail="billing@brightstone.example"
					customerPhone="9876543210"
					issuedDate="2026-09-17"
					dueDate="2026-09-30"
					issuerName={mockInvoiceIssuer.brandName}
					issuerAddress={mockInvoiceIssuer.address}
					issuerGstin={mockInvoiceIssuer.gstin}
					items={[
						{
							id: '1',
							name: 'Cloud Hosting Subscription',
							description: '',
							amount: 3500,
							taxPercent: 0
						},
						{
							id: '2',
							name: 'Data Analytics Report',
							description: '',
							amount: 1500,
							taxPercent: 0
						},
						{
							id: '3',
							name: 'On-Site Technical Support',
							description: '',
							amount: 400,
							taxPercent: 0
						}
					]}
					amount={5400}
				/>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="EmptyPreview">
	{#snippet template()}
		<div class="max-w-2xl bg-muted p-6">
			<div class="min-h-[297mm] max-w-[210mm] bg-card p-10 shadow-xl">
				<InvoiceBill
					issuerName={mockInvoiceIssuer.brandName}
					issuerAddress={mockInvoiceIssuer.address}
					issuerGstin={mockInvoiceIssuer.gstin}
				/>
			</div>
		</div>
	{/snippet}
</Story>
