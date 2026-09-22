<script lang="ts">
	import type { Component } from 'svelte';
	import { Button } from '$lib/components/reusable';
	import { FieldGrid, FieldRow, FormSection, StepShell } from '$lib/components/self-onboarding';
	import { gstinStateName } from '$lib/components/self-onboarding/gst-states';
	import { advanceFromStep } from '$lib/components/self-onboarding/navigation';
	import {
		isCinValid,
		isIdentityComplete,
		isTanValid,
		isValidGstin,
		isValidPan,
		isValidRegisteredYear,
		MIN_REGISTERED_YEAR
	} from '$lib/components/self-onboarding/validation';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { BriefcaseBusiness, Building2, Handshake, Home } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { ENTITY_TYPE_LABELS, parseEntityType, type EntityType } from '$lib/types/onboarding';
	import { cn } from '$lib/utils';

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

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	const canContinue = $derived(isIdentityComplete(data));
	const cinRequired = $derived(data.entityType === 'private_limited');
	const gstinState = $derived(isValidGstin(data.gstin) ? gstinStateName(data.gstin) : '');

	function normalizeId(value: string, maxLength: number): string {
		return value
			.replace(/[^a-zA-Z0-9]/g, '')
			.toUpperCase()
			.slice(0, maxLength);
	}

	function handleEntityChange(value: string) {
		const entityType = parseEntityType(value);
		if (entityType) {
			onboarding.setPan(data.businessPan, entityType, ENTITY_TYPE_LABELS[entityType]);
		}
	}

	function handleYearInput(next: string) {
		const digits = next.replace(/\D/g, '').slice(0, 4);
		onboarding.updateBusinessDetails({ registeredYear: digits ? Number(digits) : null });
	}

	function continueToProfile() {
		if (!canContinue) return;
		void advanceFromStep(1);
	}
</script>

<StepShell>
	<FormSection title="Registration">
		<FieldRow
			label="Business PAN"
			required
			monospace
			maxlength={10}
			autocomplete="off"
			placeholder="ABCDE1234F"
			remarkKey="kyb.businessPan"
			hint="10 characters, format ABCDE1234F."
			error={isValidPan(data.businessPan) ? '' : 'Enter a valid 10-character PAN.'}
			value={data.businessPan}
			normalize={(next) => normalizeId(next, 10)}
			oninput={(next) => onboarding.setBusinessPan(next)}
		/>

		<div class="space-y-2">
			<p class="text-sm font-medium text-foreground">
				Entity type <span class="text-destructive">*</span>
			</p>
			<RadioGroup.Root
				value={data.entityType ?? ''}
				onValueChange={handleEntityChange}
				class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3"
				aria-label="Entity type"
			>
				{#each ENTITY_OPTIONS as entity (entity.value)}
					{@const selected = data.entityType === entity.value}
					{@const Icon = entity.icon}
					<label
						class={cn(
							'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
							'has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2',
							selected
								? 'border-primary bg-primary/5'
								: 'border-border bg-card hover:border-primary/40'
						)}
					>
						<div
							class={cn(
								'flex size-9 shrink-0 items-center justify-center rounded-lg',
								selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
							)}
						>
							<Icon class="size-4" />
						</div>
						<span class="min-w-0 flex-1">
							<span class="block text-sm font-semibold text-foreground">{entity.title}</span>
							<span class="mt-0.5 block text-xs text-muted-foreground">{entity.description}</span>
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
	</FormSection>

	<FormSection title="Tax and registration numbers">
		<FieldGrid>
			<FieldRow
				label="GSTIN"
				required
				monospace
				maxlength={15}
				autocomplete="off"
				remarkKey="kyb.gstNumber"
				hint={gstinState ? `Registered in ${gstinState}` : '15 characters, e.g. 27ABCDE1234F1Z5.'}
				error={isValidGstin(data.gstin) ? '' : 'Enter a valid 15-character GSTIN.'}
				value={data.gstin}
				normalize={(next) => normalizeId(next, 15)}
				oninput={(next) => onboarding.selectGstin(next)}
			/>
			<FieldRow
				label="CIN"
				required={cinRequired}
				monospace
				maxlength={21}
				autocomplete="off"
				remarkKey="kyb.cin"
				hint={cinRequired ? '' : 'Optional for this entity type.'}
				error={isCinValid(details.cin, data.entityType)
					? ''
					: details.cin
						? 'Enter a valid 21-character CIN.'
						: 'CIN is required for private limited companies.'}
				value={details.cin}
				normalize={(next) => normalizeId(next, 21)}
				oninput={(next) => onboarding.updateBusinessDetails({ cin: next })}
			/>
			<FieldRow
				label="TAN"
				monospace
				maxlength={10}
				autocomplete="off"
				remarkKey="kyb.tan"
				hint="Optional."
				error={isTanValid(details.tan) ? '' : 'Enter a valid 10-character TAN.'}
				value={details.tan}
				normalize={(next) => normalizeId(next, 10)}
				oninput={(next) => onboarding.updateBusinessDetails({ tan: next })}
			/>
			<FieldRow
				label="Industry"
				required
				remarkKey="kyb.industry"
				placeholder="e.g. Retail, Fintech"
				error={details.industry.trim() ? '' : 'Industry is required.'}
				value={details.industry}
				oninput={(next) => onboarding.updateBusinessDetails({ industry: next })}
			/>
			<FieldRow
				label="Registered year"
				required
				inputmode="numeric"
				maxlength={4}
				placeholder="e.g. 2018"
				remarkKey="kyb.registeredYear"
				error={isValidRegisteredYear(details.registeredYear)
					? ''
					: `Enter a year between ${MIN_REGISTERED_YEAR} and ${new Date().getFullYear()}.`}
				value={details.registeredYear === null ? '' : String(details.registeredYear)}
				normalize={(next) => next.replace(/\D/g, '').slice(0, 4)}
				oninput={handleYearInput}
			/>
		</FieldGrid>
	</FormSection>

	{#snippet footer()}
		<Button disabled={!canContinue} onclick={continueToProfile}>Continue</Button>
	{/snippet}
</StepShell>
