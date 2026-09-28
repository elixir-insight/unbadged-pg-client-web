<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import InvoiceItems from './invoice-items.svelte';

	const { Story } = defineMeta({
		title: 'Invoices/InvoiceItems',
		component: InvoiceItems,
		tags: ['autodocs']
	});
</script>

<script lang="ts">
	import type { InvoiceFormLineItem } from '$lib/validation/invoice';

	let emptyItems = $state<InvoiceFormLineItem[]>([]);
	let filledItems = $state<InvoiceFormLineItem[]>([
		{
			id: 'line_1',
			name: 'Consulting',
			description: '',
			amount: '3000',
			taxPercent: '0'
		},
		{
			id: 'line_2',
			name: 'Hardware',
			description: '',
			amount: '1500',
			taxPercent: '0'
		}
	]);
</script>

<Story name="Empty">
	{#snippet template()}
		<div class="max-w-3xl p-6">
			<InvoiceItems bind:items={emptyItems} />
		</div>
	{/snippet}
</Story>

<Story name="Filled">
	{#snippet template()}
		<div class="max-w-3xl p-6">
			<InvoiceItems bind:items={filledItems} />
		</div>
	{/snippet}
</Story>
