<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { formatDashboardCurrency, type DashboardSettlement } from './dashboard-data';

	interface Props {
		settlements: DashboardSettlement[];
		error?: string | null;
		class?: string;
	}

	let { settlements, error = null, class: className }: Props = $props();

	const statusConfig = {
		settled: { label: 'Settled', class: 'bg-success/10 text-success' },
		pending: { label: 'Pending', class: 'bg-warning/15 text-warning-foreground' },
		failed: { label: 'Failed', class: 'bg-destructive/10 text-destructive' }
	} satisfies Record<DashboardSettlement['status'], { label: string; class: string }>;

	const latestSettlement = $derived(settlements[0]);
</script>

<section
	class={cn('h-full overflow-hidden rounded-lg border border-border bg-card shadow-xs', className)}
>
	<div class="flex items-center justify-between gap-3 px-3 py-3">
		<div>
			<h2 class="text-sm font-semibold text-card-foreground">Settlements</h2>
			<p class="text-xs text-muted-foreground">Payouts to your bank account</p>
		</div>
		<a
			href={resolve('/merchant/settlements')}
			class="flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	{#if error}
		<p class="px-3 py-10 text-center text-sm text-destructive">{error}</p>
	{:else}
		{#if latestSettlement}
			<div
				class="mx-3 mb-3 grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-4"
			>
				<div>
					<p class="text-xs text-muted-foreground uppercase">Last settlement</p>
					<p class="mt-1 font-semibold tabular-nums">
						{formatDashboardCurrency(latestSettlement.netAmount)}
					</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground uppercase">Date</p>
					<p class="mt-1 font-medium">{latestSettlement.date}</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground uppercase">UTR</p>
					<p class="mt-1 font-mono text-xs font-medium">{latestSettlement.utr ?? '—'}</p>
				</div>
				<div class="flex items-center sm:justify-end">
					<span
						class={cn(
							'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
							statusConfig[latestSettlement.status].class
						)}
					>
						{statusConfig[latestSettlement.status].label}
					</span>
				</div>
			</div>
		{/if}

		{#if settlements.length}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-xs">
					<caption class="sr-only">Recent settlements</caption>
					<thead class="border-y border-border bg-muted/40 text-left text-muted-foreground">
						<tr>
							<th scope="col" class="px-3 py-2 font-medium">Settlement ID</th>
							<th scope="col" class="px-3 py-2 font-medium">Date</th>
							<th scope="col" class="px-3 py-2 text-right font-medium">Gross</th>
							<th scope="col" class="hidden px-3 py-2 text-right font-medium md:table-cell">
								Refunds
							</th>
							<th scope="col" class="px-3 py-2 text-right font-medium">Net settled</th>
							<th scope="col" class="hidden px-3 py-2 font-medium lg:table-cell">UTR</th>
							<th scope="col" class="px-3 py-2 font-medium">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each settlements as settlement (settlement.id)}
							<tr class="transition-colors hover:bg-muted/30">
								<td class="px-3 py-2">
									<a
										href={resolve('/merchant/settlements/[settlementId]', {
											settlementId: settlement.id
										})}
										class="font-mono text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									>
										{settlement.id}
									</a>
								</td>
								<td class="px-3 py-2 text-muted-foreground">{settlement.date}</td>
								<td class="px-3 py-2 text-right font-medium tabular-nums">
									{formatDashboardCurrency(settlement.grossAmount)}
								</td>
								<td
									class="hidden px-3 py-2 text-right text-muted-foreground tabular-nums md:table-cell"
								>
									{formatDashboardCurrency(settlement.refunds)}
								</td>
								<td class="px-3 py-2 text-right font-semibold tabular-nums">
									{formatDashboardCurrency(settlement.netAmount)}
								</td>
								<td class="hidden px-3 py-2 font-mono text-xs text-muted-foreground lg:table-cell">
									{settlement.utr ?? '—'}
								</td>
								<td class="px-3 py-2">
									<span
										class={cn(
											'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
											statusConfig[settlement.status].class
										)}
									>
										{statusConfig[settlement.status].label}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="py-10 text-center text-sm text-muted-foreground">No settlements available.</p>
		{/if}
	{/if}
</section>
