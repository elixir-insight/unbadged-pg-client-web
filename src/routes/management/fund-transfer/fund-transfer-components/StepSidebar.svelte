<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { StepConfig } from '../fund-transfer.svelte';
	import { cn } from '$lib/utils';
	import { Check } from '$lib/assets/icons';

	let {
		steps,
		currentIndex,
		horizontal = false,
		brand,
		footer
	}: {
		steps: StepConfig[];
		currentIndex: number;
		horizontal?: boolean;
		brand?: Snippet;
		footer?: Snippet;
	} = $props();

	function stepStatus(index: number): 'complete' | 'current' | 'upcoming' {
		if (index < currentIndex) return 'complete';
		if (index === currentIndex) return 'current';
		return 'upcoming';
	}
</script>

<nav
	class={cn('flex shrink-0 flex-col gap-1', horizontal && 'flex-row gap-2 overflow-x-auto pb-1')}
	aria-label="Transfer steps"
>
	{#if brand}
		<div class={cn('mb-4', horizontal && 'hidden lg:block')}>
			{@render brand()}
		</div>
	{/if}

	<ol class={cn('relative flex flex-col gap-1', horizontal && 'flex-row flex-nowrap gap-2')}>
		{#each steps as step, index (step.id)}
			{@const status = stepStatus(index)}
			<li class={cn('relative', horizontal && 'shrink-0')}>
				<div
					class={cn(
						'relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
						status === 'current' && 'sidebar-active-indicator bg-accent text-accent-foreground',
						status === 'complete' && 'text-muted-foreground',
						status === 'upcoming' && 'text-muted-foreground',
						horizontal && 'min-w-max items-center py-2'
					)}
				>
					<span
						class={cn(
							'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
							status === 'current' && 'border-primary bg-primary text-primary-foreground',
							status === 'complete' && 'border-success bg-success-bg text-success',
							status === 'upcoming' && 'border-border bg-muted text-muted-foreground'
						)}
						aria-hidden="true"
					>
						{#if status === 'complete'}
							<Check class="size-3.5" />
						{:else}
							{index + 1}
						{/if}
					</span>

					<div class={cn('min-w-0', horizontal && 'hidden sm:block')}>
						<p class="text-sm font-medium leading-none">{step.label}</p>
						<p class="mt-1 text-xs text-muted-foreground">{step.sublabel}</p>
					</div>

					{#if horizontal}
						<p class="text-sm font-medium sm:hidden">{step.label}</p>
					{/if}
				</div>
			</li>
		{/each}
	</ol>

	{#if footer}
		<div class={cn('mt-auto pt-6', horizontal && 'hidden lg:block')}>
			{@render footer()}
		</div>
	{/if}
</nav>
