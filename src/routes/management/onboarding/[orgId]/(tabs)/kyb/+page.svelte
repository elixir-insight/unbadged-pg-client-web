<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import KybDetails from '$lib/components/onboarding/KybDetails.svelte';
	import { getOnboardingOrgById } from '$lib/data/mockData';
	import { onboardingDrafts } from '$lib/stores/onboarding-draft.svelte';
	import { getOnboardingOrgContext } from '../../onboarding-org.svelte';

	const onboarding = getOnboardingOrgContext();
	const orgId = $derived(page.params.orgId ?? '');

	const businessType = $derived.by(() => {
		const mockOrg = getOnboardingOrgById(orgId);
		if (mockOrg) return mockOrg.businessType;
		return onboardingDrafts.getById(orgId)?.businessType ?? '';
	});

	function handleNext() {
		onboarding.markStepComplete('kyb');
		goto(resolve('/management/onboarding/[orgId]/account', { orgId }));
	}
</script>

<KybDetails
	bind:directors={onboarding.directors}
	bind:nextDirectorId={onboarding.nextDirectorId}
	bind:directorDocFiles={onboarding.directorDocFiles}
	bind:isValid={onboarding.stepValid.kyb}
	{businessType}
	onnext={handleNext}
/>
