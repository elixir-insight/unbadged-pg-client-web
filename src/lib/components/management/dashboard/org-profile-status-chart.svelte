<script module lang="ts">
	export interface OrgProfileStatusItem {
		status: string;
		count: number;
		percentage: number;
		color: string;
	}
</script>

<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card';
	import { PieChart } from 'layerchart';
	import { cn } from '$lib/utils';

	let {
		data,
		class: className
	}: {
		data: OrgProfileStatusItem[];
		class?: string;
	} = $props();

	const chartData = $derived(
		data.map((item) => ({
			status: item.status,
			count: item.count,
			color: item.color
		}))
	);

	const chartConfig = $derived(
		Object.fromEntries(
			data.map((item) => [
				item.status.toLowerCase().replace(/\s+/g, '_'),
				{ label: item.status, color: item.color }
			])
		) as Chart.ChartConfig
	);

	const leadStatus = $derived(
		data.reduce((max, item) => (item.percentage > max.percentage ? item : max), data[0])
	);
</script>

<Card.Root size="sm" class={cn('flex h-full flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">Organization profile status</Card.Title>
		<Card.Description class="text-xs">Distribution by state</Card.Description>
	</Card.Header>

	<Card.Content class="flex min-h-0 flex-1 flex-col">
		<div class="flex min-h-0 flex-1 flex-col items-center">
			<div class="relative flex w-full flex-1 items-center justify-center">
				<Chart.Container config={chartConfig} class="aspect-square max-h-52 w-full max-w-52">
					<PieChart
						data={chartData}
						key="status"
						value="count"
						c="color"
						innerRadius={54}
						padding={18}
						props={{ pie: { motion: 'tween' } }}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</PieChart>
				</Chart.Container>
				<div class="pointer-events-none absolute flex flex-col items-center">
					<span class="text-2xl font-bold tabular-nums text-foreground"
						>{leadStatus.percentage}%</span
					>
					<span class="text-[10.5px] font-medium text-muted-foreground">{leadStatus.status}</span>
				</div>
			</div>

			<ul
				class="flex w-full shrink-0 flex-col divide-y divide-border"
				aria-label="Organization status breakdown"
			>
				{#each data as item (item.status)}
					<li class="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0">
						<div class="flex items-center gap-2">
							<span
								class="size-2.5 shrink-0 rounded-full"
								style:background-color={item.color}
								aria-hidden="true"
							></span>
							<span class="text-muted-foreground">{item.status}</span>
						</div>
						<span class="font-semibold tabular-nums text-foreground">{item.percentage}%</span>
					</li>
				{/each}
			</ul>
		</div>
	</Card.Content>
</Card.Root>
