<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import InvoiceBillTo from './invoice-bill-to.svelte';

	const { Story } = defineMeta({
		title: 'Invoices/InvoiceBillTo',
		component: InvoiceBillTo,
		tags: ['autodocs']
	});
</script>

<script lang="ts">
	let emptyName = $state('');
	let emptyEmail = $state('');
	let emptyPhone = $state('');
	let emptyAddress = $state('');
	let savedName = $state('Jason Momoa');
	let savedEmail = $state('jason@example.com');
	let savedPhone = $state('9876543210');
	let savedAddress = $state('18 Residency Road, Bengaluru, Karnataka 560025');
</script>

<Story name="Empty">
	{#snippet template()}
		<div class="max-w-xl p-6">
			<InvoiceBillTo
				bind:customerName={emptyName}
				bind:customerEmail={emptyEmail}
				bind:customerPhone={emptyPhone}
				bind:customerAddress={emptyAddress}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Saved">
	{#snippet template()}
		<div class="max-w-xl p-6">
			<InvoiceBillTo
				bind:customerName={savedName}
				bind:customerEmail={savedEmail}
				bind:customerPhone={savedPhone}
				bind:customerAddress={savedAddress}
			/>
		</div>
	{/snippet}
</Story>
