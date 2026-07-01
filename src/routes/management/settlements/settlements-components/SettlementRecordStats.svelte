<script lang="ts">
	import type { SettlementEntry, SettlementRecord } from '$lib/data/partnerSettlementsDummyData';
	import { formatInrDetailed, getSettlementTotals } from '$lib/data/partnerSettlementsDummyData';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { TrendingUp, Wallet, ArrowDown } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import type { Component } from 'svelte';

	let {
		record,
		entries
	}: {
		record: SettlementRecord;
		entries: SettlementEntry[];
	} = $props();

	const totals = $derived(getSettlementTotals(record, entries));

	const stats: {
		label: string;
		value: number;
		icon: Component<{ class?: string }>;
	}[] = $derived([
		{ label: 'Commission Earned', value: totals.commissionEarned, icon: TrendingUp },
		{ label: 'Total Settled', value: totals.totalSettled, icon: Wallet },
		{ label: 'Remaining', value: totals.remaining, icon: ArrowDown }
	]);
</script>

<div class="grid gap-4 sm:grid-cols-3">
	{#each stats as stat (stat.label)}
		<Card class="border-border/50 shadow-sm">
			<CardContent class="flex items-center gap-4 p-5">
				<div
					class={cn(
						'flex size-11 shrink-0 items-center justify-center rounded-full',
						'bg-primary/10 text-primary'
					)}
				>
					<stat.icon class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="text-sm text-muted-foreground">{stat.label}</p>
					<p class="mt-0.5 text-xl font-semibold tracking-tight">
						{formatInrDetailed(stat.value)}
					</p>
				</div>
			</CardContent>
		</Card>
	{/each}
</div>
