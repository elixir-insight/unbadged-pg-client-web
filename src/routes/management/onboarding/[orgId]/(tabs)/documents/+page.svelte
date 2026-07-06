<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Documents from '$lib/components/onboarding/documents.svelte';
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
		onboarding.markStepComplete('documents');
		goto(resolve('/management/onboarding/[orgId]/integration', { orgId }));
	}

	function handlePrev() {
		goto(resolve('/management/onboarding/[orgId]/account', { orgId }));
	}
</script>

<Documents
	directors={onboarding.directors}
	bind:directorDocFiles={onboarding.directorDocFiles}
	bind:isValid={onboarding.stepValid.documents}
	{businessType}
	onnext={handleNext}
	onprev={handlePrev}
/>
