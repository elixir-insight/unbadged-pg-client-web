<script lang="ts">
	import { Paperclip } from '$lib/assets/icons';
	import SupportingDocumentPanel from './supporting-document-panel.svelte';

	interface Props {
		mode?: 'management' | 'merchant';
		readOnly?: boolean;
	}

	let { mode = 'management', readOnly = false }: Props = $props();

	const managementGroups = [
		{
			title: 'Merchant Proof',
			description: 'Upload invoices, receipts, screenshots and customer proofs.',
			showMerchantVisibility: false
		},
		{
			title: 'Aggregator Correspondence',
			description: 'Upload emails, letters and acknowledgements from the aggregator.',
			showMerchantVisibility: true
		},
		{
			title: 'Final Resolution Documents',
			description: 'Upload decision letters, settlement proofs and final documents.',
			showMerchantVisibility: true
		}
	];

	const merchantGroups = [
		{
			title: 'Merchant Proof',
			description: 'Upload invoices, receipts, screenshots and customer proofs.',
			showMerchantVisibility: false
		}
	];

	const documentGroups = $derived(mode === 'merchant' ? merchantGroups : managementGroups);
</script>

<section class="rounded-xl border border-border bg-background p-6 shadow-sm">
	<div class="flex items-center gap-3">
		<span class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
			<Paperclip class="size-5" />
		</span>
		<h2 class="text-base font-semibold text-foreground">Supporting Documents</h2>
	</div>

	<div class={mode === 'merchant' ? 'mt-6 grid gap-4' : 'mt-6 grid gap-4 lg:grid-cols-3'}>
		{#each documentGroups as group (group.title)}
			<SupportingDocumentPanel
				title={group.title}
				description={group.description}
				showMerchantVisibility={group.showMerchantVisibility}
				{readOnly}
			/>
		{/each}
	</div>
</section>
