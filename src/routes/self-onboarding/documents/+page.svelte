<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { Progress } from '$lib/components/ui/progress';
	import { DocumentCard, SectionCard, StepShell } from '$lib/components/self-onboarding';
	import { gotoOnboardingStep } from '$lib/components/self-onboarding/navigation';
	import {
		DOCUMENT_LABELS,
		requiredDocumentsUploaded,
		visibleDocumentKeys
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';

	const docs = $derived(onboarding.formData.documents);
	const docKeys = $derived(visibleDocumentKeys(docs));
	const uploadedCount = $derived(docKeys.filter((key) => docs[key].uploaded).length);
	const total = $derived(docKeys.length);
	const percent = $derived(total === 0 ? 0 : Math.round((uploadedCount / total) * 100));
	const requiredUploaded = $derived(requiredDocumentsUploaded(docs));
</script>

<StepShell>
	<SectionCard title="Documents">
		<div class="mb-3">
			<div class="mb-2 flex items-center justify-between text-sm">
				<p class="font-medium">{uploadedCount} of {total} Documents Uploaded</p>
				<p class="font-semibold text-primary">{percent}%</p>
			</div>
			<Progress value={percent} max={100} aria-label="Document upload progress" />
		</div>

		<div class="flex flex-col gap-3">
			{#each docKeys as key (key)}
				<DocumentCard
					label={DOCUMENT_LABELS[key]}
					documentSlot={docs[key]}
					onupload={(file) => onboarding.updateDocument(key, file)}
					onclear={() => onboarding.clearDocument(key)}
				/>
			{/each}
		</div>
	</SectionCard>

	{#snippet footer()}
		<Button
			disabled={!requiredUploaded}
			onclick={() => {
				onboarding.completeStep(6);
				void gotoOnboardingStep('review-submit');
			}}
		>
			Continue
		</Button>
	{/snippet}
</StepShell>
