<script lang="ts">
	import { documentFieldOptions } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { DocumentCard, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep } from '$lib/components/self-onboarding/navigation';
	import {
		DOCUMENT_LABELS,
		requiredDocumentsUploaded,
		visibleDocumentKeys
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { organizationDocumentRemark } from '$lib/utils/remarkRouting';
	import { DOCUMENT_KEYS, type DocumentKey } from '$lib/types/onboarding';

	const docs = $derived(onboarding.formData.documents);
	// A remarked slot is always shown, even an optional one that's otherwise hidden.
	const docKeys = $derived(
		DOCUMENT_KEYS.filter(
			(key) =>
				visibleDocumentKeys(docs).includes(key) ||
				organizationDocumentRemark(onboarding.verifications, key) !== undefined
		)
	);
	const uploadedCount = $derived(docKeys.filter((key) => docs[key].uploaded).length);
	const total = $derived(docKeys.length);
	const canContinue = $derived(requiredDocumentsUploaded(docs));

	/** A replacement upload answers the management remark on that slot — drop it. */
	function handleUploaded(key: DocumentKey, file: File) {
		onboarding.updateDocument(key, file);
		const remark = organizationDocumentRemark(onboarding.verifications, key);
		if (remark) onboarding.clearVerification(remark.key);
	}
</script>

<StepShell>
	<p class="text-sm font-medium">{uploadedCount} of {total} documents uploaded</p>

	<div class="flex flex-col gap-3">
		{#each docKeys as key (key)}
			{@const remark = organizationDocumentRemark(onboarding.verifications, key)}
			<InlineRemark
				remark={remark?.message ?? ''}
				fieldKey={remark?.key ?? ''}
				highlighted={Boolean(remark) && onboarding.focusField === remark?.key}
				instruction="Please update this document based on the management remark."
			>
				<DocumentCard
					label={DOCUMENT_LABELS[key]}
					documentType={key}
					documentSlot={docs[key]}
					fieldOptions={documentFieldOptions(key)}
					onuploaded={(file) => handleUploaded(key, file)}
					onclear={() => onboarding.clearDocument(key)}
				/>
			</InlineRemark>
		{/each}
	</div>

	{#snippet footer()}
		<Button disabled={!canContinue} onclick={() => void advanceFromStep(5)}>Continue</Button>
	{/snippet}
</StepShell>
