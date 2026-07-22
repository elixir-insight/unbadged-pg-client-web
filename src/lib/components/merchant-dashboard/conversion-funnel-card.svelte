<script lang="ts">
	import { cn } from '$lib/utils';
	import type { FunnelOutcome, FunnelStage } from './dashboard-data';

	interface Props {
		stages: FunnelStage[];
		outcomes: FunnelOutcome[];
		overallConversionRate?: number | null;
		error?: string | null;
		class?: string;
	}

	let {
		stages,
		outcomes,
		overallConversionRate = null,
		error = null,
		class: className
	}: Props = $props();

	const numberFormatter = new Intl.NumberFormat('en-IN');
</script>

<section
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-xs',
		className
	)}
>
	<div class="shrink-0">
		<h2 class="text-sm font-semibold text-card-foreground">Conversion Funnel</h2>
		<p class="mt-0.5 text-xs text-muted-foreground">
			{#if overallConversionRate !== null}
				{overallConversionRate}% overall conversion
			{:else}
				Order lifecycle
			{/if}
		</p>
	</div>

	{#if error}
		<p class="mt-3 text-sm text-destructive" role="alert">{error}</p>
	{/if}

	{#if stages.length}
		<ol class="mt-4 flex min-h-0 flex-1 flex-col gap-3" aria-label="Collection conversion stages">
			{#each stages as stage (stage.label)}
				<li class="flex min-h-0 flex-1 flex-col justify-center gap-2">
					<div class="flex items-center justify-between gap-3 text-sm">
						<span class="font-semibold text-foreground">{stage.label}</span>
						<span class="flex items-center gap-2 tabular-nums">
							<span class="font-medium text-muted-foreground">
								{numberFormatter.format(stage.count)}
							</span>
							{#if stage.change !== null}
								<span
									class={cn('font-medium', stage.change < 0 ? 'text-destructive' : 'text-success')}
								>
									{stage.change > 0 ? '+' : ''}{stage.change}%
								</span>
							{/if}
						</span>
					</div>
					<div
						class="h-5 w-full overflow-hidden rounded-full bg-muted"
						role="img"
						aria-label={`${stage.label}: ${stage.percentage}%`}
					>
						<div
							class="h-full rounded-full bg-linear-to-r from-chart-1 to-chart-2"
							style:width={`${stage.percentage}%`}
						></div>
					</div>
				</li>
			{/each}
		</ol>

		{#if outcomes.length}
			<div class="mt-3 flex shrink-0 flex-wrap gap-2 border-t border-border pt-3">
				{#each outcomes as outcome (outcome.label)}
					<span
						class={cn(
							'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs',
							outcome.label === 'Failed'
								? 'bg-destructive/10 text-destructive'
								: 'bg-muted text-muted-foreground'
						)}
					>
						<span class="font-medium">{outcome.label}</span>
						<span class="tabular-nums">{numberFormatter.format(outcome.count)}</span>
					</span>
				{/each}
			</div>
		{/if}
	{:else if !error}
		<p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
			No funnel data available.
		</p>
	{/if}
</section>
