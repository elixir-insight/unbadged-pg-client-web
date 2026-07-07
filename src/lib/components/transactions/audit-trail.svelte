<script lang="ts">
	import { cn } from '$lib/utils';
	import type { AuditEvent } from '$lib/data/payin-transactions-mock';

	let { events }: { events: AuditEvent[] } = $props();
</script>

{#if events.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-12 text-center"
	>
		<p class="text-sm font-medium text-muted-foreground">No audit history available</p>
		<p class="text-xs text-muted-foreground/60">
			Lifecycle events for this transaction will appear here.
		</p>
	</div>
{:else}
	<ol class="relative">
		{#each events as event, i (event.id)}
			{@const isLast = i === events.length - 1}
			<li class="flex gap-3">
				<div class="flex flex-col items-center">
					<div
						class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
					>
						<span class="text-[10px] font-semibold">{i + 1}</span>
					</div>
					{#if !isLast}
						<div class="mt-1 w-px flex-1 bg-border"></div>
					{/if}
				</div>
				<div class={cn('min-w-0 flex-1 pb-5', isLast && 'pb-0')}>
					<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
						<p class="text-sm font-semibold text-foreground">{event.event}</p>
						<p class="text-xs text-muted-foreground">{event.timestamp}</p>
					</div>
					<p class="mt-1 text-xs text-muted-foreground/80">{event.statusChange}</p>
					<p class="mt-1 text-xs text-muted-foreground/70">
						Performed by <span class="font-medium text-foreground/80">{event.performedBy}</span>
					</p>
					{#if event.remarks}
						<p class="mt-1.5 text-sm text-foreground/80">{event.remarks}</p>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
{/if}
