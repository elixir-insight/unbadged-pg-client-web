<script module lang="ts">
	export interface PaymentMethodShare {
		method: string;
		percentage: number;
		color: string;
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { BarChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		methods: PaymentMethodShare[];
		class?: string;
	}

	let { methods, class: className }: Props = $props();

	const chartConfig = $derived(
		methods.reduce((config, m) => {
			config[m.method] = { label: m.method, color: m.color };
			return config;
		}, {} as Chart.ChartConfig)
	);

	// Largest share on top — matches a typical ranked-bar reading order.
	const rankedMethods = $derived([...methods].sort((a, b) => b.percentage - a.percentage));
	const methodOrder = $derived(rankedMethods.map((m) => m.method));
	const methodColors = $derived(rankedMethods.map((m) => m.color));
	// Headroom past the largest bar so its tip label doesn't run off the card edge.
	const xMax = $derived((rankedMethods[0]?.percentage ?? 0) * 1.25);
</script>

<div
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-center justify-between">
		<p class="text-sm font-semibold">Payment methods</p>
		<a
			href={resolve('/merchant/transactions')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<Chart.Container config={chartConfig} class="mt-2 min-h-0 w-full flex-1">
		<BarChart
			data={rankedMethods}
			x="percentage"
			y="method"
			orientation="horizontal"
			c="method"
			cDomain={methodOrder}
			cRange={methodColors}
			axis="y"
			grid={false}
			xDomain={[0, xMax]}
			bandPadding={0.55}
			padding={{ left: 76, right: 28 }}
			props={{
				yAxis: { tickLabelProps: { class: 'fill-muted-foreground text-xs' } },
				bars: { motion: 'tween', stroke: 'none', strokeWidth: 0 }
			}}
			labels={{
				format: (v: number) => `${v}%`,
				class: 'fill-foreground text-xs font-medium'
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip hideLabel nameKey="method" />
			{/snippet}
		</BarChart>
	</Chart.Container>
</div>
