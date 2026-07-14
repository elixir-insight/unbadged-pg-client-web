<script lang="ts">
	import { Chip, Tooltip } from '$lib/components/reusable';
	import type { PayinTimelineEntry } from '$lib/types/payin';
	import { cn } from '$lib/utils';
	import { formatAbsoluteTime, formatRelativeTime } from '$lib/utils/format-time';

	let { entries }: { entries: PayinTimelineEntry[] } = $props();

	let now = $state(Date.now());

	$effect(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 60_000);

		return () => clearInterval(interval);
	});
</script>

<ol class="relative">
	{#each entries as entry, i (i)}
		{@const isLast = i === entries.length - 1}
		<li class="flex gap-4">
			<div class="flex flex-col items-center">
				{#if entry.transactionStatus === 'failed'}
					<div
						class="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
					>
						<svg viewBox="0 0 12 12" class="size-3" fill="none">
							<path
								d="M3 3l6 6M9 3l-6 6"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
							/>
						</svg>
					</div>
				{:else if entry.isCompleted}
					<div
						class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
					>
						<svg viewBox="0 0 12 12" class="size-3" fill="none">
							<path
								d="M2 6l3 3 5-5"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				{:else}
					<div
						class="size-5 shrink-0 rounded-full border-2 border-muted-foreground bg-muted-foreground"
					></div>
				{/if}
				{#if !isLast}
					<div class="mt-1 w-px flex-1 bg-border"></div>
				{/if}
			</div>

			<div class={cn('min-w-0 flex-1 pb-6', isLast && 'pb-0')}>
				<div class="mb-0.5">
					<Tooltip content={formatAbsoluteTime(entry.timestampMs)}>
						<span class="text-xs text-muted-foreground">
							{formatRelativeTime(entry.timestampMs, now)}
						</span>
					</Tooltip>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-sm font-semibold text-foreground">{entry.entryTitle}</p>
					{#if entry.attemptNumber}
						<Chip variant="outline" class="h-auto rounded-full px-2 py-0.5 text-xs">
							Attempt {entry.attemptNumber}
						</Chip>
					{/if}
				</div>
				<p class="mt-0.5 text-sm text-muted-foreground">{entry.entryDescription}</p>

				{#if entry.utr || entry.bankRRN}
					<p class="mt-2 text-xs text-muted-foreground/70">
						{#if entry.utr}
							<span class="font-medium uppercase">UTR</span>
							{entry.utr}
						{/if}
						{#if entry.utr && entry.bankRRN}<span class="mx-1.5">·</span>{/if}
						{#if entry.bankRRN}
							<span class="font-medium uppercase">RRN</span>
							{entry.bankRRN}
						{/if}
					</p>
				{/if}

				{#if entry.errorDescription}
					<p class="mt-1.5 text-xs text-destructive">{entry.errorDescription}</p>
				{/if}

				{#if entry.cardNumber}
					<p class="mt-1 text-xs text-muted-foreground/70">
						{entry.cardType}
						{entry.cardNumber}
					</p>
				{/if}

				{#if entry.refundId}
					<p class="mt-1.5 text-xs text-muted-foreground/70">
						<span class="font-medium">Refund ID</span>
						{entry.refundId}
						{#if entry.refundType}
							· {entry.refundType}
						{/if}
						{#if entry.refundSpeed}
							· {entry.refundSpeed}
						{/if}
					</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>
