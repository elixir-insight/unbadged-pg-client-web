<script lang="ts">
	import { getContext } from 'svelte';
	import { Button } from '$lib/components/reusable';
	import {
		DirectorCard,
		InlineRemark,
		SectionCard,
		StepShell
	} from '$lib/components/self-onboarding';
	import { advanceFromTab } from '$lib/components/self-onboarding/navigation';
	import { STAGE_NAV_KEY, type StageNav } from '$lib/components/self-onboarding/stage-nav.svelte';
	import { directorsAreComplete } from '$lib/components/self-onboarding/validation';
	import { Plus } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { directorRemarkIndex, remarksForTab } from '$lib/utils/remarkRouting';

	const stageNav = getContext<StageNav | undefined>(STAGE_NAV_KEY);
	const canContinue = $derived(directorsAreComplete(onboarding.formData));
	const directorRemarks = $derived(remarksForTab(onboarding.verifications, 'directors'));
	const focusField = $derived(onboarding.focusField);

	function remarksForDirector(index: number) {
		return directorRemarks.filter((remark) => directorRemarkIndex(remark.key) === index);
	}

	function continueToDocuments() {
		if (!canContinue) return;
		void advanceFromTab('directors');
	}

	$effect.pre(() => {
		stageNav?.setConfig({
			canContinue,
			onContinue: continueToDocuments,
			label: 'Continue'
		});
	});
</script>

<StepShell>
	<SectionCard title="Directors">
		{#snippet action()}
			<Button variant="outline" size="sm" onclick={() => onboarding.addDirector()}>
				<Plus class="size-4" />
				Add Director
			</Button>
		{/snippet}

		<div class="flex flex-col gap-3">
			{#if onboarding.formData.directors.length === 0}
				<p class="text-sm text-muted-foreground">
					Add at least one director with a name and valid PAN.
				</p>
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
		</div>
	</SectionCard>

	{#snippet footer()}
		<Button disabled={!canContinue} onclick={continueToDocuments}>Continue</Button>
	{/snippet}
</StepShell>
