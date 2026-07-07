<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ChevronDown, XIcon } from '$lib/assets/icons';
	import { fly, slide } from 'svelte/transition';
	import { getTransactionTypeMeta, getTransactionTypesForPipeline } from './va-form-constants';

	interface Props {
		pipeline: string;
		selectedTypes: string[];
		onRemoveType?: (type: string) => void;
		id?: string;
	}

	let {
		pipeline,
		selectedTypes = $bindable([]),
		onRemoveType,
		id = 'tx-type-trigger'
	}: Props = $props();

	const availableTypes = $derived(getTransactionTypesForPipeline(pipeline));
	const hasPipeline = $derived(pipeline.trim() !== '');

	function isChecked(value: string): boolean {
		return selectedTypes.includes(value);
	}

	function setChecked(value: string, checked: boolean) {
		if (checked) {
			if (!selectedTypes.includes(value)) {
				selectedTypes = [...selectedTypes, value];
			}
			return;
		}
		selectedTypes = selectedTypes.filter((type) => type !== value);
	}

	function removeType(value: string) {
		selectedTypes = selectedTypes.filter((type) => type !== value);
		onRemoveType?.(value);
	}
</script>

<div class="space-y-2">
	<label
		for={id}
		class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
	>
		Transaction Types
	</label>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			{id}
			disabled={!hasPipeline || availableTypes.length === 0}
			class="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if !hasPipeline}
				<span class="text-muted-foreground/60">Select a bank pipeline first…</span>
			{:else if availableTypes.length === 0}
				<span class="text-muted-foreground/60">No transaction types available</span>
			{:else if selectedTypes.length === 0}
				<span class="text-muted-foreground/60">Select transaction types…</span>
			{:else}
				<span class="font-medium">
					{selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} selected
				</span>
			{/if}
			<ChevronDown class="size-4 shrink-0 text-muted-foreground/50 transition-transform" />
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="start" class="min-w-48">
			{#each availableTypes as type (type.value)}
				<DropdownMenu.CheckboxItem
					checked={isChecked(type.value)}
					onCheckedChange={(checked) => setChecked(type.value, checked === true)}
				>
					{type.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	{#if hasPipeline && availableTypes.length === 0}
		<p class="text-xs text-muted-foreground">
			No transaction types are available for this bank pipeline.
		</p>
	{/if}

	{#if selectedTypes.length > 0}
		<div class="flex flex-wrap gap-2 pt-0.5" transition:slide={{ duration: 200, axis: 'y' }}>
			{#each selectedTypes as type (type)}
				{@const meta = getTransactionTypeMeta(type)}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 py-1 pr-2 pl-3 text-xs font-semibold text-primary transition-all duration-150"
					in:fly={{ y: -4, duration: 180 }}
				>
					{meta?.label ?? type}
					<button
						type="button"
						aria-label="Remove {meta?.label ?? type}"
						onclick={() => removeType(type)}
						class="flex size-4 items-center justify-center rounded-full opacity-50 transition-all hover:bg-primary/20 hover:opacity-100"
					>
						<XIcon class="size-2.5" />
					</button>
				</span>
			{/each}
		</div>
	{/if}
</div>
