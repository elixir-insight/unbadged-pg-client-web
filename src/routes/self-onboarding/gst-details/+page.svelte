<script lang="ts">
	import { getContext } from 'svelte';
	import { Button, Input } from '$lib/components/reusable';
	import { InlineRemark, SectionCard, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromTab } from '$lib/components/self-onboarding/navigation';
	import { STAGE_NAV_KEY, type StageNav } from '$lib/components/self-onboarding/stage-nav.svelte';
	import { isValidGstin } from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';

	const stageNav = getContext<StageNav | undefined>(STAGE_NAV_KEY);
	const gstin = $derived(onboarding.formData.gstin);
	const gstinValid = $derived(isValidGstin(gstin));
	const gstRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.gstNumber'));
	const focusField = $derived(onboarding.focusField === 'kyb.gstNumber');

	function handleGstinInput(event: Event & { currentTarget: HTMLInputElement }) {
		onboarding.selectGstin(
			event.currentTarget.value
				.replace(/[^a-zA-Z0-9]/g, '')
				.toUpperCase()
				.slice(0, 15)
		);
	}

	function continueToBusiness() {
		if (!gstinValid) return;
		void advanceFromTab('gst');
	}

	$effect.pre(() => {
		stageNav?.setConfig({
			canContinue: gstinValid,
			onContinue: continueToBusiness,
			label: 'Continue'
		});
	});
</script>

<StepShell>
	<SectionCard>
		<InlineRemark remark={gstRemark} fieldKey="kyb.gstNumber" highlighted={focusField}>
			<label class="block w-full max-w-sm space-y-1">
				<span class="text-sm font-medium text-primary">GSTIN</span>
				<Input
					id="gstin"
					class="font-mono tracking-widest uppercase"
					maxlength={15}
					value={gstin}
					aria-invalid={gstin.length === 15 && !gstinValid}
					oninput={handleGstinInput}
				/>
				{#if gstin.length === 15 && !gstinValid}
					<p class="text-xs text-destructive">Enter a valid 15-character GSTIN.</p>
				{:else}
					<p class="text-xs text-muted-foreground">
						Enter the 15-character GSTIN for this business.
					</p>
				{/if}
			</label>
		</InlineRemark>
	</SectionCard>

	{#snippet footer()}
		<Button disabled={!gstinValid} onclick={continueToBusiness}>Continue</Button>
	{/snippet}
</StepShell>
