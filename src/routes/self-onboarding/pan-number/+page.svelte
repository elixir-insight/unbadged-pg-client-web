<script lang="ts">
	import { getContext } from 'svelte';
	import { Button, Input } from '$lib/components/reusable';
	import { InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromTab } from '$lib/components/self-onboarding/navigation';
	import { STAGE_NAV_KEY, type StageNav } from '$lib/components/self-onboarding/stage-nav.svelte';
	import { isValidPan } from '$lib/components/self-onboarding/validation';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { BriefcaseBusiness, Building2, Handshake, Home } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { ENTITY_TYPE_LABELS, type EntityType } from '$lib/types/onboarding';
	import { getFieldRemark } from '$lib/utils/remarkRouting';
	import { cn } from '$lib/utils';
	import type { Component } from 'svelte';

	const ENTITY_OPTIONS: {
		value: EntityType;
		title: string;
		description: string;
		icon: Component;
	}[] = [
		{
			value: 'proprietorship',
			title: ENTITY_TYPE_LABELS.proprietorship,
			description: 'Sole proprietor or individual business',
			icon: Home
		},
		{
			value: 'partnership',
			title: ENTITY_TYPE_LABELS.partnership,
			description: 'Registered partnership firm',
			icon: Handshake
		},
		{
			value: 'llp',
			title: ENTITY_TYPE_LABELS.llp,
			description: 'Limited liability partnership',
			icon: BriefcaseBusiness
		},
		{
			value: 'private_limited',
			title: ENTITY_TYPE_LABELS.private_limited,
			description: 'Private limited company',
			icon: Building2
		}
	];

	const stageNav = getContext<StageNav | undefined>(STAGE_NAV_KEY);
	const panValid = $derived(isValidPan(onboarding.formData.businessPan));
	const canContinue = $derived(panValid && onboarding.formData.entityType !== null);
	const panRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.businessPan'));
	const focusField = $derived(onboarding.focusField === 'kyb.businessPan');
	const selectedEntity = $derived(onboarding.formData.entityType ?? '');

	function handlePanInput(event: Event & { currentTarget: HTMLInputElement }) {
		onboarding.formData.businessPan = event.currentTarget.value
			.replace(/[^a-zA-Z0-9]/g, '')
			.toUpperCase()
			.slice(0, 10);
	}

	function selectEntity(type: EntityType) {
		onboarding.setPan(onboarding.formData.businessPan, type, ENTITY_TYPE_LABELS[type]);
	}

	function handleEntityChange(value: string) {
		if (
			value === 'proprietorship' ||
			value === 'partnership' ||
			value === 'llp' ||
			value === 'private_limited'
		) {
			selectEntity(value);
		}
	}

	function continueToGst() {
		if (!canContinue || !onboarding.formData.entityType) return;
		selectEntity(onboarding.formData.entityType);
		void advanceFromTab('pan');
	}

	$effect.pre(() => {
		stageNav?.setConfig({
			canContinue,
			onContinue: continueToGst,
			label: 'Continue',
			hint: 'Your PAN is encrypted and never shared'
		});
	});
</script>

<StepShell>
	{#snippet header()}
		<header class="mb-8">
			<h1 class="text-2xl font-bold tracking-tight text-card-foreground">Verify your business</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				We use your PAN to auto-fill company details in the next steps.
			</p>
		</header>
	{/snippet}

	<div class="flex flex-col gap-8">
		<InlineRemark remark={panRemark} fieldKey="kyb.businessPan" highlighted={focusField}>
			<label for="business-pan" class="block text-sm font-medium text-foreground">PAN number</label>
			<div class="mt-2">
				<Input
					id="business-pan"
					class="h-11 font-mono tracking-widest uppercase"
					maxlength={10}
					autocomplete="off"
					placeholder="ABCDE1234F"
					value={onboarding.formData.businessPan}
					aria-invalid={onboarding.formData.businessPan.length === 10 && !panValid}
					oninput={handlePanInput}
				/>
			</div>
			{#if onboarding.formData.businessPan.length === 10 && !panValid}
				<p class="mt-2 text-xs text-destructive">Enter a valid 10-character PAN.</p>
			{:else}
				<p class="mt-2 text-xs text-muted-foreground">10 characters, format ABCDE1234F.</p>
			{/if}
		</InlineRemark>

		<div class="space-y-3">
			<p class="text-sm font-medium text-foreground">Entity type</p>
			<RadioGroup.Root
				value={selectedEntity}
				onValueChange={handleEntityChange}
				class="flex flex-col gap-3"
				aria-label="Entity type"
			>
				{#each ENTITY_OPTIONS as entity (entity.value)}
					{@const selected = onboarding.formData.entityType === entity.value}
					{@const Icon = entity.icon}
					<label
						class={cn(
							'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
							'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
							selected
								? 'border-primary bg-primary/5'
								: 'border-border bg-card hover:border-primary/40'
						)}
					>
						<div
							class={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-lg',
								selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
							)}
						>
							<Icon class="size-5" />
						</div>
						<span class="min-w-0 flex-1">
							<span class="block text-sm font-semibold text-foreground">{entity.title}</span>
							<span class="mt-0.5 block text-sm text-muted-foreground">{entity.description}</span>
						</span>
						<RadioGroup.Item
							value={entity.value}
							aria-label={entity.title}
							class="focus-visible:border-primary focus-visible:ring-0"
						/>
					</label>
				{/each}
			</RadioGroup.Root>
		</div>
	</div>

	{#snippet footer()}
		<Button disabled={!canContinue} onclick={continueToGst}>Continue</Button>
	{/snippet}
</StepShell>
