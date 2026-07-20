<script lang="ts" module>
	import type { BadgeVariant } from '$lib/components/ui/badge';

	export type StatCardTone = 'success' | 'warning' | 'danger' | 'brand';

	/** Maps our semantic tone names onto chip.svelte's real variant prop. */
	const toneToChipVariant: Record<StatCardTone, BadgeVariant> = {
		success: 'success',
		warning: 'warning',
		danger: 'destructive',
		brand: 'default'
	};

	const toneToTextClass: Record<StatCardTone, string> = {
		success: 'text-success',
		warning: 'text-warning',
		danger: 'text-destructive',
		brand: 'text-foreground'
	};

	const toneToBorderClass: Record<StatCardTone, string> = {
		success: 'border-l-success',
		warning: 'border-l-warning',
		danger: 'border-l-destructive',
		brand: 'border-l-transparent'
	};

	const toneToSelectedClass: Record<StatCardTone, string> = {
		success: 'ring-1 ring-success/30 bg-success/5',
		warning: 'ring-1 ring-warning/30 bg-warning/5',
		danger: 'ring-1 ring-destructive/30 bg-destructive/5',
		brand: 'ring-1 ring-primary/30 bg-primary/5'
	};
</script>

<script lang="ts">
	import Chip from '$lib/components/reusable/chip/chip.svelte';
	import { cn } from '$lib/utils';

	let {
		label,
		value,
		badgeText,
		badgeVariant,
		subText,
		valueTone,
		accent,
		selected = false,
		onclick,
		class: className
	}: {
		label: string;
		value: string;
		badgeText?: string;
		badgeVariant?: StatCardTone;
		subText?: string;
		/** Colors just the value text — for status-like numbers (e.g. Successful/Pending/Failed). */
		valueTone?: StatCardTone;
		/** Adds a left accent border in the matching semantic color, square on that side. */
		accent?: StatCardTone;
		/** Highlights the card as the active filter, when clickable. */
		selected?: boolean;
		/** Makes the card an interactive filter trigger instead of a static display. */
		onclick?: () => void;
		class?: string;
	} = $props();

	const interactive = $derived(!!onclick);

	const cardClass = $derived(
		cn(
			'border border-border bg-card shadow-xs text-left',
			accent
				? cn('rounded-l-none rounded-r-lg border-l-2', toneToBorderClass[accent])
				: 'rounded-lg',
			interactive &&
				'cursor-pointer transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
			selected && accent && toneToSelectedClass[accent],
			className
		)
	);
</script>

{#snippet content()}
	<div class="flex flex-col gap-2.5 p-4">
		<div class="flex items-start justify-between gap-2">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
			{#if badgeText && badgeVariant}
				<Chip variant={toneToChipVariant[badgeVariant]} class="shrink-0">{badgeText}</Chip>
			{/if}
		</div>

		<p
			class={cn(
				'font-mono text-xl font-semibold tabular-nums',
				valueTone ? toneToTextClass[valueTone] : 'text-foreground'
			)}
		>
			{value}
		</p>

		{#if subText}
			<p class="text-xs text-muted-foreground">{subText}</p>
		{/if}
	</div>
{/snippet}

{#if interactive}
	<button type="button" {onclick} class={cardClass}>
		{@render content()}
	</button>
{:else}
	<div class={cardClass}>
		{@render content()}
	</div>
{/if}
