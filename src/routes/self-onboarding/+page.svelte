<script lang="ts">
	import { onMount } from 'svelte';
	import { gotoOnboardingStep } from '$lib/components/self-onboarding/navigation';
	import { savedCompletedSteps } from '$lib/components/self-onboarding/saved-steps';
	import { firstIncompleteStep, STEPS } from '$lib/components/self-onboarding/steps';
	import { allRoutedRemarks } from '$lib/utils/remarkRouting';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	onMount(() => {
		const [firstRemark] = allRoutedRemarks(data.verifications);
		const step = firstRemark ? firstRemark.step : firstIncompleteStep(savedCompletedSteps(data));
		void gotoOnboardingStep(STEPS[step - 1].path, firstRemark?.key);
	});
</script>
