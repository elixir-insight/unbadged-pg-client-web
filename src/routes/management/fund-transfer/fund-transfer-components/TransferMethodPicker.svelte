<script lang="ts">
	import type { TransferMethod } from '../fund-transfer.svelte';
	import { getFeatureIcon } from '../fund-transfer.svelte';
	import { cn } from '$lib/utils';

	let {
		methods,
		value = null,
		onSelect
	}: {
		methods: TransferMethod[];
		value?: TransferMethod | null;
		onSelect: (method: TransferMethod) => void;
	} = $props();
</script>

<div
	class="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[1200px]:grid-cols-4"
	role="radiogroup"
	aria-label="Transfer method"
>
	{#each methods as method (method.id)}
		{@const Icon = getFeatureIcon(method.icon)}
		{@const selected = value?.id === method.id}
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			class={cn(
				'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors',
				'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
				selected
					? 'border-primary bg-accent text-accent-foreground'
					: 'border-border bg-card hover:bg-muted'
			)}
			onclick={() => onSelect(method)}
		>
			<span
				class={cn(
					'flex size-8 items-center justify-center rounded-md',
					selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
				)}
			>
				<Icon class="size-4" />
			</span>
			<span>
				<span class="block text-sm font-semibold">{method.label}</span>
				<span class="block text-xs text-muted-foreground">{method.description}</span>
				<span class="mt-1 block text-xs font-medium">{method.limitLabel}</span>
			</span>
		</button>
	{/each}
</div>

{#if value}
	<p class="mt-3 text-xs text-muted-foreground">{value.info}</p>
{/if}
