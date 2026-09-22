<script lang="ts">
	import { onMount } from 'svelte';
	import { gotoOnboardingStep } from '$lib/components/self-onboarding/navigation';
	import { firstIncompleteStep, STEPS } from '$lib/components/self-onboarding/steps';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { allRoutedRemarks } from '$lib/utils/remarkRouting';

	onMount(() => {
		const [firstRemark] = allRoutedRemarks(onboarding.verifications);
		const step = firstRemark ? firstRemark.step : firstIncompleteStep(onboarding.completedSteps);
		void gotoOnboardingStep(STEPS[step - 1].path, firstRemark?.key);
	});
</script>
