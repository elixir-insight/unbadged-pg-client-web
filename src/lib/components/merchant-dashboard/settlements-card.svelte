<script module lang="ts">
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
		pendingSettlement: string;
		lastSettlementAmount: string;
		lastSettlementStatus?: LastSettlementStatus;
		class?: string;
	}

	let {
		availableFunds,
		availableFundsChangeLabel = '+4.2%',
		pendingSettlement,
		lastSettlementAmount,
		lastSettlementStatus = 'success',
		class: className
	}: Props = $props();

	const lastSettlementStatusMeta = {
		success: { label: 'Success', variant: 'success' as const },
		pending: { label: 'Pending', variant: 'warning' as const }
	} satisfies Record<LastSettlementStatus, { label: string; variant: 'success' | 'warning' }>;
</script>

<div
	class={cn(
		'flex h-full min-h-0 flex-col gap-1.5 rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<p class="shrink-0 text-sm font-semibold mb-2">Settlement insights</p>

	<div
		class="flex shrink-0 items-center justify-between rounded-xl bg-linear-to-br from-chart-1/20 via-chart-2/14 to-chart-3/10 p-2 mb-2"
	>
		<div class="min-w-0">
			<p class="text-xs font-medium tracking-wide text-muted-foreground">Available funds</p>
			<p class="mt-0.5 truncate text-lg font-bold tracking-tight text-foreground">
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

	<div class="flex flex-col min-h-0 gap-3">
		<div class="flex flex-col justify-center rounded-lg bg-muted px-2 py-2">
			<p class="text-[11px] tracking-wide text-muted-foreground">Pending settlement</p>
			<p class="mt-0.5 text-sm font-semibold tracking-tight">{pendingSettlement}</p>
		</div>
		<div class="flex flex-col justify-center rounded-lg bg-muted px-2 py-2">
			<div class="flex items-center justify-between gap-1">
				<p class="text-[11px] tracking-wide text-muted-foreground">Last settled</p>
				<Chip variant={lastSettlementStatusMeta[lastSettlementStatus].variant} class="shrink-0">
					{lastSettlementStatusMeta[lastSettlementStatus].label}
				</Chip>
			</div>
			<p class="mt-0.5 text-sm font-semibold tracking-tight">{lastSettlementAmount}</p>
		</div>
	</div>
	<div class="flex justify-end mt-3">
		<a
			href={resolve('/merchant/settlements')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all Settlements
			<ArrowRight class="size-3" />
		</a>
	</div>
</div>
