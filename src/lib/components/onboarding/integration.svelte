<script lang="ts">
	import * as v from 'valibot';
	import { Button, Input, toast } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import { integrationSchema, flattenIssues } from '$lib/validation/onboarding';
	import { Plug } from '$lib/assets/icons';
	import OnboardingStepShell from './onboarding-step-shell.svelte';
	import OnboardingSection from './onboarding-section.svelte';
	import StepNavFooter from './step-nav-footer.svelte';

	let {
		isValid = $bindable(false),
		seed = undefined as { callbackUrl?: string; ipAddress?: string } | undefined,
		hideNavigation = false,
		onprev = () => {},
		onsubmit = () => {}
	}: {
		isValid?: boolean;
		seed?: { callbackUrl?: string; ipAddress?: string };
		hideNavigation?: boolean;
		onprev?: () => void;
		onsubmit?: () => void;
	} = $props();

	let callbackUrl = $state('');
	let ipAddress = $state('');
	let seedApplied = $state(false);

	$effect.pre(() => {
		if (!seed || seedApplied) return;
		callbackUrl = seed.callbackUrl ?? '';
		ipAddress = seed.ipAddress ?? '';
		seedApplied = true;
	});

	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function validate(): boolean {
		const result = v.safeParse(integrationSchema, { callbackUrl, ipAddress });
		errors = result.success ? {} : flattenIssues(result.issues);
		return result.success;
	}

	const canContinue = $derived(v.safeParse(integrationSchema, { callbackUrl, ipAddress }).success);

	const allMandatoryFilled = $derived(callbackUrl.trim() !== '');

	const canSave = $derived(allMandatoryFilled && Object.keys(errors).length === 0);

	$effect(() => {
		if (isValid !== canContinue) {
			isValid = canContinue;
		}
	});

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function handleSubmit() {
		submitAttempted = true;
		if (!validate()) return;
		onsubmit();
	}

	function handlePanelSave() {
		submitAttempted = true;
		if (!validate()) return;
		toast.success('Application integration updated successfully');
	}

	function clearIntegration() {
		callbackUrl = '';
		ipAddress = '';
		errors = {};
		submitAttempted = false;
	}
</script>

<OnboardingStepShell
	icon={Plug}
	title="Application Integration"
	description="Configure callback and IP endpoints"
>
	<OnboardingSection title="Webhook & Callbacks" description="Payment notification endpoints">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-3">
				<label class="text-sm font-medium" for="callbackUrl">
					Callback URL <span class="text-rose-500">*</span>
				</label>
				<Input
					id="callbackUrl"
					bind:value={callbackUrl}
					oninput={onFieldInput}
					placeholder="Enter Callback URL"
					class={cn(errors.callbackUrl && 'border-destructive focus-visible:ring-destructive/30')}
				/>
				{#if submitAttempted && errors.callbackUrl}
					<p class="text-xs text-rose-500">{errors.callbackUrl}</p>
				{/if}
			</div>
			<div class="flex flex-col gap-3">
				<label class="text-sm font-medium" for="ipAddress">IP Address</label>
				<Input
					id="ipAddress"
					bind:value={ipAddress}
					oninput={onFieldInput}
					placeholder="Enter IP Address"
					class={cn(errors.ipAddress && 'border-destructive focus-visible:ring-destructive/30')}
				/>
				{#if submitAttempted && errors.ipAddress}
					<p class="text-xs text-rose-500">{errors.ipAddress}</p>
				{/if}
			</div>
		</div>
	</OnboardingSection>

	{#snippet footer()}
		{#if !hideNavigation}
			<StepNavFooter
				showPrev
				{onprev}
				showClear
				onclear={clearIntegration}
				onnext={handleSubmit}
				nextLabel="Save & Continue"
				nextDisabled={!canSave}
			/>
		{:else}
			<div class="flex w-full justify-end border-t border-border pt-4">
				<Button
					size="sm"
					class="gradient-primary text-primary-foreground"
					onclick={handlePanelSave}
					disabled={!canSave}
				>
					Save changes
				</Button>
			</div>
		{/if}
	{/snippet}
</OnboardingStepShell>
