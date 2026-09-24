<script lang="ts">
	import { documentFieldOptions, getDocumentKeyForFieldName } from '$lib/api/onboarding';
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
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const docs = $derived(onboarding.formData.documents);
	const docKeys = $derived(visibleDocumentKeys(docs));
	const uploadedCount = $derived(docKeys.filter((key) => docs[key].uploaded).length);
	const total = $derived(docKeys.length);
	const percent = $derived(total === 0 ? 0 : Math.round((uploadedCount / total) * 100));
	const canContinue = $derived(requiredDocumentsUploaded(docs));

	// Reconciles with documents uploaded outside this browser session (see hydrateDocumentUploaded
	// — only ever turns a slot on, never off, so it's safe to run on every load).
	$effect(() => {
		for (const fieldName of data.uploadedFieldNames) {
			const key = getDocumentKeyForFieldName(fieldName);
			if (key) onboarding.hydrateDocumentUploaded(key);
		}
	});
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
				documentType={key}
				documentSlot={docs[key]}
				fieldOptions={documentFieldOptions(key)}
				onuploaded={(file) => onboarding.updateDocument(key, file)}
				onclear={() => onboarding.clearDocument(key)}
			/>
		{/each}
	</div>

	{#snippet footer()}
		<Button disabled={!canContinue} onclick={() => void advanceFromStep(5)}>Continue</Button>
	{/snippet}
</StepShell>
