<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { formatDashboardCurrency, type DashboardTransaction } from './dashboard-data';

	interface Props {
		transactions: DashboardTransaction[];
		class?: string;
	}

	let { transactions, class: className }: Props = $props();

	const statusConfig = {
		success: { label: 'Captured', class: 'bg-success/10 text-success' },
		pending: { label: 'Pending', class: 'bg-warning/15 text-warning-foreground' },
		failed: { label: 'Failed', class: 'bg-destructive/10 text-destructive' },
		authorized: { label: 'Authorized', class: 'bg-warning/15 text-warning-foreground' },
		refunded: { label: 'Refunded', class: 'bg-primary/10 text-primary' }
	} satisfies Record<DashboardTransaction['status'], { label: string; class: string }>;
</script>

<section
	class={cn(
		'flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
		<div>
			<h2 class="text-sm font-semibold text-card-foreground">Recent transactions</h2>
			<p class="text-xs text-muted-foreground">Latest collection attempts</p>
		</div>
		<a
			href={resolve('/merchant/transactions/collections/payments')}
			class="flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	{#if transactions.length}
		<div class="min-h-0 flex-1 overflow-x-auto">
			<table class="w-full border-collapse text-xs">
				<caption class="sr-only">Recent collection transactions</caption>
				<thead class="border-y border-border bg-muted/40 text-left text-muted-foreground">
					<tr>
						<th scope="col" class="px-4 py-2.5 font-medium">Order</th>
						<th scope="col" class="px-4 py-2.5 font-medium">Customer</th>
						<th scope="col" class="hidden px-4 py-2.5 font-medium lg:table-cell">Method</th>
						<th scope="col" class="px-4 py-2.5 font-medium">Status</th>
						<th scope="col" class="hidden px-4 py-2.5 font-medium xl:table-cell">Settlement</th>
						<th scope="col" class="px-4 py-2.5 text-right font-medium">Amount</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each transactions.slice(0, 6) as transaction (transaction.id)}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="px-4 py-3">
								<a
									href={resolve('/merchant/transactions/collections/orders/[orderId]', {
										orderId: transaction.id
									})}
									class="font-mono text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									{transaction.id}
								</a>
								<p class="mt-0.5 text-xs text-muted-foreground">{transaction.date}</p>
							</td>
							<td class="px-4 py-3 font-medium">{transaction.customer}</td>
							<td class="hidden px-4 py-3 text-muted-foreground lg:table-cell">
								{transaction.method}
							</td>
							<td class="px-4 py-3">
								<span
									class={cn(
										'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
										statusConfig[transaction.status].class
									)}
								>
									{statusConfig[transaction.status].label}
								</span>
							</td>
							<td class="hidden px-4 py-3 text-muted-foreground xl:table-cell">
								{transaction.settlement}
							</td>
							<td class="px-4 py-3 text-right font-semibold tabular-nums">
								{formatDashboardCurrency(transaction.amount)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
			No recent transactions.
		</p>
	{/if}
</section>
