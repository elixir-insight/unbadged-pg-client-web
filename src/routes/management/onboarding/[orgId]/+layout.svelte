<script lang="ts">
	import { OnboardingOrgState, setOnboardingOrgContext } from './onboarding-org.svelte';

	let { children } = $props();

	const onboarding = new OnboardingOrgState();
	setOnboardingOrgContext(onboarding);
</script>

{@render children()}
