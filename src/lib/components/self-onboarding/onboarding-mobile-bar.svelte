<script lang="ts">
	import OnboardingProfileCard from './onboarding-profile-card.svelte';
	import { STAGES, type StageKey } from './stages';
	import StageProgress from './stage-progress.svelte';

	let {
		currentStage,
		currentTabLabel
	}: {
		currentStage: StageKey;
		currentTabLabel: string;
	} = $props();

	const stageIndex = $derived(STAGES.findIndex((item) => item.key === currentStage));
</script>

<div class="flex items-center gap-1 border-b border-border bg-sidebar">
	<div class="min-w-0 flex-1 px-4 py-4">
		<StageProgress currentIndex={stageIndex} total={STAGES.length} label={currentTabLabel} />
	</div>
	<OnboardingProfileCard isCollapsed />
</div>
