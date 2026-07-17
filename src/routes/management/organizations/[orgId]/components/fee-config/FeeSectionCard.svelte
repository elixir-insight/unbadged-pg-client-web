<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { Check } from '$lib/assets/icons';
	import type { FeeSlabRow } from '$lib/fee-config/types';
	import EffectiveDateFields from './EffectiveDateFields.svelte';
	import FeeConfigCard from './FeeConfigCard.svelte';
	import FeeSlabTable from './FeeSlabTable.svelte';

	let {
		title,
		subtitle,
		disabled = false,
		placeholder,
		slabs = $bindable([]),
		effectiveFrom = $bindable(''),
		effectiveTo = $bindable(''),
		rowErrors = {},
		validationErrors = [],
		saveLabel,
		saved = false,
		onSave
	}: {
		title: string;
		subtitle: string;
		disabled?: boolean;
		placeholder?: string;
		slabs?: FeeSlabRow[];
		effectiveFrom?: string;
		effectiveTo?: string;
		rowErrors?: Record<string, string[]>;
		validationErrors?: string[];
		saveLabel: string;
		saved?: boolean;
		onSave?: () => void;
	} = $props();
</script>

{#snippet body()}
	{#if disabled && placeholder}
		<p
			class="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground"
		>
			{placeholder}
		</p>
	{:else}
		<FeeSlabTable bind:slabs {rowErrors} />

		{#if validationErrors.length > 0}
			<ul class="mt-4 space-y-1" role="alert">
				{#each validationErrors as error (error)}
					<li class="text-sm text-destructive">{error}</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-5">
			<EffectiveDateFields bind:effectiveFrom bind:effectiveTo />
		</div>
	{/if}
{/snippet}

{#snippet footerContent()}
	{#if !disabled}
		<div class="flex items-center justify-between gap-3">
			{#if saved}
				<p class="text-sm text-primary" role="status">Saved to local configuration.</p>
			{:else}
				<span></span>
			{/if}
			<Button type="button" onclick={onSave} {disabled}>
				<Check class="size-4" />
				{saveLabel}
			</Button>
		</div>
	{/if}
{/snippet}

<FeeConfigCard {title} {subtitle}>
	{@render body()}
	{#snippet footer()}
		{@render footerContent()}
	{/snippet}
</FeeConfigCard>
