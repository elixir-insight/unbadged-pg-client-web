<script lang="ts">
	import { TrendingDown, TrendingUp } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		label: string;
		value: string;
		subtext: string;
		change?: number;
		tone?: 'default' | 'warning' | 'success';
		class?: string;
	}

	let { label, value, subtext, change, tone = 'default', class: className }: Props = $props();
</script>

<article
	class={cn(
		'relative flex min-h-32 overflow-hidden rounded-lg border border-border bg-card p-5 shadow-xs',
		tone === 'warning' && 'border-l-2 border-l-warning',
		tone === 'success' && 'border-l-2 border-l-success',
		className
	)}
>
	<div class="flex min-w-0 flex-1 flex-col">
		<p class="truncate text-sm font-medium text-muted-foreground">{label}</p>
		<p class="mt-2 text-2xl font-semibold tracking-tight text-card-foreground tabular-nums">
			{value}
		</p>
		<div class="mt-auto flex min-w-0 items-center gap-2 pt-3 text-sm">
			{#if change !== undefined}
				<span
					class={cn(
						'flex shrink-0 items-center gap-1 font-medium',
						change >= 0 ? 'text-success' : 'text-destructive'
					)}
				>
					{#if change >= 0}
						<TrendingUp class="size-3.5" />
					{:else}
						<TrendingDown class="size-3.5" />
					{/if}
					{change > 0 ? '+' : ''}{change}%
				</span>
			{/if}
			<span class="truncate text-muted-foreground">{subtext}</span>
		</div>
	</div>
</article>
