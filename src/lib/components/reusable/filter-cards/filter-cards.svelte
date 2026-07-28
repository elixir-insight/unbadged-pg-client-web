<script module lang="ts">
	export interface FilterCard {
		label: string;
		count: number;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';

	interface Props {
		cards?: FilterCard[];
		selected?: string;
		loading?: boolean;
		skeletonCount?: number;
		onselect?: (label: string) => void;
		class?: string;
	}

	let {
		cards = [],
		selected = $bindable(''),
		loading = false,
		skeletonCount = 6,
		onselect,
		class: className
	}: Props = $props();

	let skeletonItems = $derived(Array.from({ length: skeletonCount }, (_, i) => i));

	function handleSelect(label: string) {
		selected = label;
		onselect?.(label);
	}
</script>

<div class={cn('grid gap-4 ', className)}>
	{#if loading}
		{#each skeletonItems as i (i)}
			<div class="rounded-lg border border-border bg-background p-4 shadow-xs">
				<Skeleton class="mb-2 h-4 w-3/4" />
				<Skeleton class="h-7 w-3/4" />
			</div>
		{/each}
	{:else}
		{#each cards as card (card.label)}
			<button
				type="button"
				disabled={card.disabled}
				onclick={() => handleSelect(card.label)}
				class={cn(
					'cursor-pointer rounded-lg border p-4 text-left shadow-xs transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					card.disabled && 'cursor-default opacity-70',
					selected === card.label
						? 'border-primary bg-primary/10 ring-1 ring-primary/20'
						: 'border-border bg-background enabled:hover:border-primary/40 enabled:hover:bg-accent enabled:hover:shadow-sm'
				)}
			>
				<h4
					class={cn(
						'text-sm font-medium',
						selected === card.label ? 'text-primary' : 'text-foreground'
					)}
				>
					{card.label}
				</h4>
				<p
					class={cn(
						'mt-1 text-xl font-bold',
						selected === card.label ? 'text-primary' : 'text-muted-foreground'
					)}
				>
					{card.count}
				</p>
			</button>
		{/each}
	{/if}
</div>
