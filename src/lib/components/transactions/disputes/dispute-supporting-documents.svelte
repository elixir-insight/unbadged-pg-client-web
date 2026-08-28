<script lang="ts">
	import { Paperclip } from '$lib/assets/icons';
	import {
		type DisputeDocumentType,
		type DisputeDocumentView,
		type DisputeDocumentsByType
	} from '$lib/utils/dispute-documents';
	import SupportingDocumentPanel from './supporting-document-panel.svelte';

	interface Props {
		mode?: 'management' | 'merchant';
		orgId?: string;
		disputeId?: string;
		documents?: DisputeDocumentsByType;
		documentsError?: string | null;
	}

	interface DocumentGroup {
		title: string;
		description: string;
		documentType: DisputeDocumentType;
		showMerchantVisibility: boolean;
		allowUpload: boolean;
		documents: DisputeDocumentView[];
	}

	let {
		mode = 'management',
		orgId = '',
		disputeId = '',
		documents,
		documentsError = null
	}: Props = $props();

	const managementGroups = $derived<DocumentGroup[]>([
		{
			title: 'Merchant Proof',
			description: 'Upload invoices, receipts, screenshots and customer proofs.',
			documentType: 'MERCHANT_PROOF',
			showMerchantVisibility: false,
			allowUpload: true,
			documents: documents?.merchantProof ?? []
		},
		{
			title: 'Aggregator Correspondence',
			description: 'Upload emails, letters and acknowledgements from the aggregator.',
			documentType: 'AGGREGATOR_CORRESPONDENCE',
			showMerchantVisibility: true,
			allowUpload: true,
			documents: documents?.aggregatorCorrespondence ?? []
		},
		{
			title: 'Final Resolution Documents',
			description: 'Upload decision letters, settlement proofs and final documents.',
			documentType: 'FINAL_RESOLUTION_DOC',
			showMerchantVisibility: true,
			allowUpload: true,
			documents: documents?.finalResolutionDoc ?? []
		}
	]);

	const merchantGroups = $derived<DocumentGroup[]>([
		{
			title: 'Merchant Proof',
			description: 'Invoices, receipts, screenshots and customer proofs for this dispute.',
			documentType: 'MERCHANT_PROOF',
			showMerchantVisibility: false,
			allowUpload: true,
			documents: documents?.merchantProof ?? []
		},
		{
			title: 'Aggregator Correspondence',
			description: 'Emails, letters and acknowledgements shared with you for this dispute.',
			documentType: 'AGGREGATOR_CORRESPONDENCE',
			showMerchantVisibility: false,
			allowUpload: false,
			documents: documents?.aggregatorCorrespondence ?? []
		},
		{
			title: 'Final Resolution Documents',
			description: 'Decision letters, settlement proofs and final documents shared with you.',
			documentType: 'FINAL_RESOLUTION_DOC',
			showMerchantVisibility: false,
			allowUpload: false,
			documents: documents?.finalResolutionDoc ?? []
		}
	]);

	const documentGroups = $derived(mode === 'merchant' ? merchantGroups : managementGroups);
</script>

<section class="rounded-xl border border-border bg-background p-6 shadow-sm">
	<div class="flex items-center gap-3">
		<span class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
			<Paperclip class="size-5" />
		</span>
		<div>
			<h2 class="text-base font-semibold text-foreground">Supporting Documents</h2>
			{#if mode === 'management'}
				<p class="mt-0.5 text-sm text-muted-foreground">
					Each file includes its own review status and review note.
				</p>
			{/if}
		</div>
	</div>

	{#if documentsError}
		<p class="mt-4 text-sm text-destructive">{documentsError}</p>
	{/if}

	<div class="mt-6 grid gap-4 lg:grid-cols-3">
		{#each documentGroups as group (group.documentType)}
			<SupportingDocumentPanel
				title={group.title}
				description={group.description}
				documentType={group.documentType}
				{mode}
				{orgId}
				{disputeId}
				initialDocuments={group.documents}
				showMerchantVisibility={group.showMerchantVisibility}
				reviewEditable={mode === 'management'}
				allowUpload={group.allowUpload}
			/>
		{/each}
	</div>
</section>
