<script lang="ts">
	import { fetchOrganization, saveDirectors } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { DirectorCard, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { extractDirectorIds } from '$lib/components/self-onboarding/director-ids';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import { directorsAreComplete } from '$lib/components/self-onboarding/validation';
	import { Plus } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { directorRemarkIndex, remarksForStep } from '$lib/utils/remarkRouting';

	let saving = $state(false);
	let saveError = $state('');

	const canContinue = $derived(directorsAreComplete(onboarding.formData));
	const directorRemarks = $derived(remarksForStep(onboarding.verifications, 4));
	const focusField = $derived(onboarding.focusField);

	function remarksForDirector(index: number) {
		return directorRemarks.filter((remark) => directorRemarkIndex(remark.key) === index);
	}

	/** Records the ids the backend assigned so later saves update instead of duplicating. */
	async function storeDirectorIds(saved: { data: unknown[] }, count: number) {
		let ids = extractDirectorIds(saved.data, count);
		if (!ids) {
			try {
				ids = extractDirectorIds((await fetchOrganization()).data, count);
			} catch {
				ids = null;
			}
		}
		if (ids) onboarding.setDirectorIds(ids);
	}

	async function continueToDocuments() {
		if (!canContinue || saving) return;
		saving = true;
		saveError = '';
		try {
			const saved = await saveDirectors(onboarding.formData);
			await storeDirectorIds(saved, onboarding.formData.directors.length);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Could not save directors. Please try again.';
			saveError = await routeSaveError(message, 4);
			saving = false;
			return;
		}
		saving = false;
		await advanceFromStep(4);
	}
</script>

<StepShell error={saveError}>
	<div class="flex flex-col gap-4">
		{#if onboarding.formData.directors.length === 0}
			<p class="text-sm text-muted-foreground">Add at least one director to continue.</p>
		{/if}

		{#each onboarding.formData.directors as director, index (index)}
			{@const remarks = remarksForDirector(index)}
			<InlineRemark
				remark={remarks.map((item) => `${item.field}: ${item.message}`).join(' ')}
				fieldKey={remarks[0]?.key ?? `directors[${index}]`}
				highlighted={Boolean(focusField && directorRemarkIndex(focusField) === index)}
			>
				<DirectorCard
					{director}
					{index}
					onupdate={(i, patch) => onboarding.updateDirector(i, patch)}
					onremove={(i) => onboarding.removeDirector(i)}
				/>
			</InlineRemark>
		{/each}

		<div>
			<Button variant="outline" size="sm" onclick={() => onboarding.addDirector()}>
				<Plus class="size-4" />
				Add director
			</Button>
		</div>
	</div>

	{#snippet footer()}
		<Button disabled={!canContinue || saving} onclick={continueToDocuments}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
