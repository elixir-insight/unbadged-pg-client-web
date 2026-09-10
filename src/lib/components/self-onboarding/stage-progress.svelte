<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		currentIndex,
		total = 4,
		label
	}: {
		currentIndex: number;
		total?: number;
		label: string;
	} = $props();

	const stepNumber = $derived(Math.min(Math.max(currentIndex, 0) + 1, total));
</script>

<div class="space-y-3">
	<p class="text-sm text-muted-foreground">
		Step <span class="font-medium text-primary">{stepNumber}</span>
		of {total}
		<span class="text-muted-foreground"> · {label}</span>
	</p>
	<div
		class="flex gap-2"
		role="progressbar"
		aria-valuemin={1}
		aria-valuemax={total}
		aria-valuenow={stepNumber}
		aria-label={`Onboarding step ${stepNumber} of ${total}`}
	>
		{#each Array.from({ length: total }, (_, index) => index) as index (index)}
			<span
				class={cn('h-1.5 flex-1 rounded-full', index < stepNumber ? 'bg-primary' : 'bg-muted')}
				aria-hidden="true"
			></span>
		{/each}
	</div>
</div>
