<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import BankDetails from '$lib/components/onboarding/BankDetails.svelte';
	import { getOnboardingOrgContext } from '../onboarding-org.svelte';

	const onboarding = getOnboardingOrgContext();
	const orgId = $derived(page.params.orgId ?? '');

	function handleNext() {
		onboarding.markStepComplete('account');
		goto(resolve('/management/onboarding/[orgId]/documents', { orgId }));
	}

	function handlePrev() {
		goto(resolve('/management/onboarding/[orgId]/kyb', { orgId }));
	}
</script>

<BankDetails bind:isValid={onboarding.stepValid.account} onnext={handleNext} onprev={handlePrev} />
