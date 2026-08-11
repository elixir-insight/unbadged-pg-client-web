<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DonutChart from './donut-chart.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/DonutChart',
		component: DonutChart,
		tags: ['autodocs']
	});

	const sampleSegments = [
		{ label: 'UPI', value: 420000 },
		{ label: 'Cards', value: 280000 },
		{ label: 'Net Banking', value: 160000 },
		{ label: 'Wallets', value: 90000 }
	];
</script>

<Story name="Default">
	{#snippet template()}
		<div class="max-w-md">
			<DonutChart
				segments={sampleSegments}
				centerLabel="Total Volume"
				valueFormatter={(value) =>
					new Intl.NumberFormat('en-IN', {
						style: 'currency',
						currency: 'INR',
						maximumFractionDigits: 0
					}).format(value)}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Empty">
	{#snippet template()}
		<div class="max-w-md">
			<DonutChart segments={[]} />
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template()}
		<div class="max-w-md">
			<DonutChart segments={sampleSegments} loading />
		</div>
	{/snippet}
</Story>
