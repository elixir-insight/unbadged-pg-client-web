<script lang="ts">
	import OnboardingProfileCard from './onboarding-profile-card.svelte';
	import StepProgress from './step-progress.svelte';
	import { STEPS, type StepId } from './steps';

	let {
		currentStep
	}: {
		currentStep: StepId;
	} = $props();
</script>

<div class="flex items-center gap-1 border-b border-border bg-background">
	<div class="min-w-0 flex-1 px-4 py-4">
		<StepProgress
			currentIndex={currentStep - 1}
			total={STEPS.length}
			label={STEPS[currentStep - 1].label}
		/>
	</div>
	<OnboardingProfileCard isCollapsed />
</div>
