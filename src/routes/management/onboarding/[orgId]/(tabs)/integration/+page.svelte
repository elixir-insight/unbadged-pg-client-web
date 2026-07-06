<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
	import { ShieldCheck } from '$lib/assets/icons';
	import Integration from '$lib/components/onboarding/integration.svelte';
	import { getOnboardingOrgContext } from '../../onboarding-org.svelte';

	const onboarding = getOnboardingOrgContext();
	const orgId = $derived(page.params.orgId ?? '');

	function handlePrev() {
		goto(resolve('/management/onboarding/[orgId]/documents', { orgId }));
	}

	function handleSubmit() {
		onboarding.markStepComplete('integration');
	}
</script>

<Integration
	bind:isValid={onboarding.stepValid.integration}
	onprev={handlePrev}
	onsubmit={handleSubmit}
/>

{#if onboarding.showApproveAction}
	<div class="flex justify-end pt-1">
		<Button
			size="sm"
			class="gradient-primary text-primary-foreground"
			onclick={() => (onboarding.showApproveModal = true)}
		>
			<ShieldCheck class="size-4" />
			Approve
		</Button>
	</div>
{/if}
