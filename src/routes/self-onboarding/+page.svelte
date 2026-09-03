<script lang="ts">
	import { onMount } from 'svelte';
	import {
		gotoOnboardingStage,
		gotoOnboardingTab
	} from '$lib/components/self-onboarding/navigation';
	import { resumeDestination } from '$lib/components/self-onboarding/stage-status';
	import { onboarding } from '$lib/stores/onboarding.svelte';

	onMount(() => {
		const destination = resumeDestination(onboarding.formData, {
			profileStatus: onboarding.profileStatus,
			verifications: onboarding.verifications
		});
		if (destination.kind === 'tab') {
			void gotoOnboardingTab(destination.id);
			return;
		}
		void gotoOnboardingStage(destination.key);
	});
</script>
