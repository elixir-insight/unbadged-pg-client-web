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
		class: className
	}: {
		label: string;
		value: string;
		badgeText: string;
		badgeVariant: StatCardTone;
		subText?: string;
		class?: string;
	} = $props();
</script>

<div class={cn('rounded-lg border border-border bg-card shadow-xs', className)}>
	<div class="flex flex-col gap-2.5 p-4">
		<div class="flex items-start justify-between gap-2">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
			<Chip variant={toneToChipVariant[badgeVariant]} class="shrink-0">{badgeText}</Chip>
		</div>

		<p class="font-mono text-xl font-semibold tabular-nums text-foreground">{value}</p>

		{#if subText}
			<p class="text-xs text-muted-foreground">{subText}</p>
		{/if}
	</div>
</div>
