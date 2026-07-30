<script lang="ts">
	import { Paperclip } from '$lib/assets/icons';
	import SupportingDocumentPanel from './supporting-document-panel.svelte';

	const documentGroups = [
		{
			title: 'Merchant Proof',
			description: 'Upload invoices, receipts, screenshots and customer proofs.'
		},
		{
			title: 'Aggregator Correspondence',
			description: 'Upload emails, letters and acknowledgements from the aggregator.'
		},
		{
			title: 'Final Resolution Documents',
			description: 'Upload decision letters, settlement proofs and final documents.'
		}
	];
</script>

<section class="rounded-xl border border-border bg-background p-6 shadow-sm">
	<div class="flex items-center gap-3">
		<span class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
			<Paperclip class="size-5" />
		</span>
		<h2 class="text-base font-semibold text-foreground">Supporting Documents</h2>
	</div>

	<div class="mt-6 grid gap-4 lg:grid-cols-3">
		{#each documentGroups as group (group.title)}
			<SupportingDocumentPanel title={group.title} description={group.description} />
		{/each}
	</div>
</section>
