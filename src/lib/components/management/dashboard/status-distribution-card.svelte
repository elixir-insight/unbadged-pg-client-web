<script module lang="ts">
	export interface StatusDatum {
		label: string;
		amount: number;
		percentage: number;
		color: string;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { PieChart } from 'layerchart';
	import { cn } from '$lib/utils';

	let {
		title,
		description,
		data,
		totalLabel = 'Total',
		formatValue = (v: number) => `${v}`,
		class: className
	}: {
		title: string;
		description: string;
		data: StatusDatum[];
		totalLabel?: string;
		formatValue?: (value: number) => string;
		class?: string;
	} = $props();

	const total = $derived(data.reduce((sum, item) => sum + item.amount, 0));

	const chartConfig = $derived(
		Object.fromEntries(
			data.map((item) => [
				item.label.toLowerCase().replace(/\s+/g, '_'),
				{ label: item.label, color: item.color }
			])
		) as Chart.ChartConfig
	);
</script>

<Card.Root class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Description class="text-xs">{description}</Card.Description>
	</Card.Header>

	<Card.Content class="flex min-h-0 flex-1 flex-col items-center justify-center">
		<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 sm:flex-row">
			<div class="relative flex size-44 shrink-0 items-center justify-center">
				<Chart.Container config={chartConfig} class="h-full w-full">
					<PieChart
						{data}
						key="label"
						value="amount"
						c="color"
						innerRadius={54}
						padding={14}
						props={{ pie: { motion: 'tween' } }}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</PieChart>
				</Chart.Container>
				<div class="pointer-events-none absolute flex flex-col items-center">
					<span class="text-xs font-medium text-muted-foreground">{totalLabel}</span>
					<span class="text-base font-bold tabular-nums text-foreground">{formatValue(total)}</span>
				</div>
			</div>

			<ul class="flex w-full flex-col gap-5 sm:w-auto" aria-label="Status breakdown">
				{#each data as item (item.label)}
					<li class="flex flex-col gap-1 text-xs">
						<span class="flex items-center gap-2">
							<span
								class="size-2.5 shrink-0 rounded-full"
								style:background-color={item.color}
								aria-hidden="true"
							></span>
							<span class="font-medium text-foreground">{item.label}</span>
						</span>
						<span class="pl-4.5 text-muted-foreground">
							<span class="font-semibold text-foreground">{item.percentage}%</span>
							({formatValue(item.amount)})
						</span>
					</li>
				{/each}
			</ul>
		</div>
	</Card.Content>
</Card.Root>
