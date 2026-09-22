<script lang="ts">
	import { isOrgDocumentUploadSupported, uploadOrgDocument } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { Progress } from '$lib/components/ui/progress';
	import { DocumentCard, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep } from '$lib/components/self-onboarding/navigation';
	import {
		DOCUMENT_LABELS,
		requiredDocumentsUploaded,
		visibleDocumentKeys
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { DocumentKey } from '$lib/types/onboarding';

	const docs = $derived(onboarding.formData.documents);
	const docKeys = $derived(visibleDocumentKeys(docs));
	const uploadedCount = $derived(docKeys.filter((key) => docs[key].uploaded).length);
	const total = $derived(docKeys.length);
	const percent = $derived(total === 0 ? 0 : Math.round((uploadedCount / total) * 100));
	const canContinue = $derived(requiredDocumentsUploaded(docs));

	// Only marks the slot uploaded once the file has actually reached the server — DocumentCard
	// shows the thrown error inline and leaves the slot as not-uploaded on failure.
	async function handleUpload(key: DocumentKey, file: File) {
		await uploadOrgDocument(key, file);
		onboarding.updateDocument(key, file);
	}
</script>

<StepShell>
	<div>
		<div class="mb-2 flex items-center justify-between text-sm">
			<p class="font-medium">{uploadedCount} of {total} documents uploaded</p>
			<p class="font-semibold text-primary">{percent}%</p>
		</div>
		<Progress value={percent} max={100} aria-label="Document upload progress" />
	</div>

	<div class="flex flex-col gap-3">
		{#each docKeys as key (key)}
			<DocumentCard
				label={DOCUMENT_LABELS[key]}
				documentSlot={docs[key]}
				disabled={!isOrgDocumentUploadSupported(key)}
				disabledNote="Upload pending backend confirmation"
				onupload={(file) => handleUpload(key, file)}
				onclear={() => onboarding.clearDocument(key)}
			/>
		{/each}
	</div>

	{#snippet footer()}
		<Button disabled={!canContinue} onclick={() => void advanceFromStep(5)}>Continue</Button>
	{/snippet}
</StepShell>
