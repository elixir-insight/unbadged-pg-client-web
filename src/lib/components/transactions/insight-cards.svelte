<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Wallet, TrendingUp, Receipt } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		availableFunds: number;
		todayVolume: number;
		todayCount: number;
		loading?: boolean;
		class?: string;
	}

	let {
		availableFunds,
		todayVolume,
		todayCount,
		loading = false,
		class: className
	}: Props = $props();

	const fmt = (n: number) =>
		'₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const cards = $derived([
		{
			label: 'Available PayIn Funds',
			value: fmt(availableFunds),
			icon: Wallet,
			accent: 'text-primary bg-primary/10',
			gradient: 'bg-gradient-card-1'
		},
		{
			label: 'Current Day Transaction Volume',
			value: fmt(todayVolume),
			icon: TrendingUp,
			accent: 'text-green-600 bg-green-500/10 dark:text-green-400',
			gradient: 'bg-gradient-card-2'
		},
		{
			label: 'Total Transactions Today',
			value: todayCount.toLocaleString('en-IN'),
			icon: Receipt,
			accent: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
			gradient: 'bg-gradient-card-3'
		}
	]);
</script>

<div class={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
	{#if loading}
		{#each Array.from({ length: 3 }, (_, i) => i) as i (i)}
			<div class="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
				<Skeleton class="mb-3 h-9 w-9 rounded-lg" />
				<Skeleton class="mb-2 h-4 w-2/3" />
				<Skeleton class="h-7 w-1/2" />
			</div>
		{/each}
	{:else}
		{#each cards as card (card.label)}
			<div
				class={cn(
					card.gradient,
					'rounded-xl border border-border/50 p-5 shadow-sm transition-shadow hover:shadow-md'
				)}
			>
				<div class={cn('mb-3 flex size-9 items-center justify-center rounded-lg', card.accent)}>
					<card.icon class="size-5" />
				</div>
				<p class="text-sm font-medium text-muted-foreground">{card.label}</p>
				<p class="mt-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
			</div>
		{/each}
	{/if}
</div>
