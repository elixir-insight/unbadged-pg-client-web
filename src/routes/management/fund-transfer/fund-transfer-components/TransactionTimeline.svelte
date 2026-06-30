<script lang="ts">
	import type { TimelineStep } from '../fund-transfer.svelte';
	import { cn } from '$lib/utils';
	import { Check, Loader2, Circle, XCircle } from '$lib/assets/icons';

	let {
		steps
	}: {
		steps: TimelineStep[];
	} = $props();

	function stateIcon(state: TimelineStep['state']) {
		switch (state) {
			case 'done':
				return Check;
			case 'active':
				return Loader2;
			case 'failed':
				return XCircle;
			default:
				return Circle;
		}
	}
</script>

<ol class="space-y-0">
	{#each steps as step, index (step.label)}
		{@const Icon = stateIcon(step.state)}
		{@const isLast = index === steps.length - 1}
		<li class="relative flex gap-3 pb-6 last:pb-0">
			{#if !isLast}
				<span
					class={cn(
						'absolute top-8 left-3.5 h-[calc(100%-1.5rem)] w-px -translate-x-1/2',
						step.state === 'done' ? 'bg-success' : 'bg-border'
					)}
					aria-hidden="true"
				></span>
			{/if}

			<span
				class={cn(
					'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border',
					step.state === 'done' && 'border-success bg-success-bg text-success',
					step.state === 'active' && 'border-primary bg-accent text-accent-foreground',
					step.state === 'failed' && 'border-destructive bg-destructive/10 text-destructive',
					step.state === 'pending' && 'border-border bg-muted text-muted-foreground'
				)}
			>
				<Icon class={cn('size-3.5', step.state === 'active' && 'animate-spin')} />
			</span>

			<div class="min-w-0 pt-0.5">
				<p class="text-sm font-medium">{step.label}</p>
				<p class="text-xs text-muted-foreground">{step.sublabel}</p>
			</div>
		</li>
	{/each}
</ol>
