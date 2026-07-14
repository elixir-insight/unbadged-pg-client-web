<script module lang="ts">
	export interface SettlementStatusSummary {
		completed: number;
		processing: number;
		failed: number;
	}

	export type LastSettlementStatus = 'success' | 'pending';
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, TrendingUp } from '$lib/assets/icons';
	import { Chip } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		availableFunds: string;
		availableFundsChangeLabel?: string;
		lastSettlementAmount: string;
		lastSettlementStatus?: LastSettlementStatus;
		statusSummary: SettlementStatusSummary;
		class?: string;
	}

	let {
		availableFunds,
		availableFundsChangeLabel = '+4.2%',
		lastSettlementAmount,
		lastSettlementStatus = 'success',
		statusSummary,
		class: className
	}: Props = $props();

	const lastSettlementStatusMeta = {
		success: { label: 'Success', variant: 'success' as const },
		pending: { label: 'Pending', variant: 'warning' as const }
	} satisfies Record<LastSettlementStatus, { label: string; variant: 'success' | 'warning' }>;

	const statusItems = $derived([
		{ label: 'Completed', value: statusSummary.completed, color: 'bg-emerald-500' },
		{ label: 'Processing', value: statusSummary.processing, color: 'bg-orange-500' },
		{ label: 'Failed', value: statusSummary.failed, color: 'bg-red-500' }
	]);
</script>

<div
	class={cn(
		'flex h-full min-h-0 flex-col rounded-lg border border-border bg-background px-3 py-2 shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-center justify-between">
		<p class="text-sm font-semibold">Settlement insights</p>
		<a
			href={resolve('/merchant/settlements')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<div class="mt-1.5 flex min-h-0 flex-1 flex-col justify-between gap-1.5 overflow-hidden">
		<div
			class="flex shrink-0 items-center justify-between rounded-xl bg-linear-to-br from-chart-1/20 via-chart-2/14 to-chart-3/10 p-2.5"
		>
			<div class="min-w-0">
				<p class="text-xs font-medium tracking-wide text-muted-foreground">Available funds</p>
				<p class="mt-0.5 truncate text-xl font-bold tracking-tight text-foreground">
					{availableFunds}
				</p>
			</div>
			<span
				class="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
			>
				<TrendingUp class="size-3" />
				{availableFundsChangeLabel}
			</span>
		</div>

		<div class="flex shrink-0 flex-col justify-center rounded-lg bg-muted p-2.5">
			<div class="flex items-center justify-between gap-2">
				<p class="text-xs font-medium tracking-wide text-muted-foreground">Last settled</p>
				<Chip variant={lastSettlementStatusMeta[lastSettlementStatus].variant} class="shrink-0">
					{lastSettlementStatusMeta[lastSettlementStatus].label}
				</Chip>
			</div>
			<p class="mt-0.5 text-lg font-bold tracking-tight">{lastSettlementAmount}</p>
		</div>
	</div>

	<div
		class="mt-1.5 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-1.5 text-xs"
	>
		{#each statusItems as item (item.label)}
			<div class="flex items-center gap-1.5">
				<span class="size-2 shrink-0 rounded-full {item.color}"></span>
				<span class="text-muted-foreground">{item.label}</span>
				<span class="font-semibold">{item.value}</span>
			</div>
		{/each}
	</div>
</div>
