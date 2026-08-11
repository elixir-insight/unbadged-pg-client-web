<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AreaChartCard from './area-chart-card.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/AreaChartCard',
		component: AreaChartCard,
		tags: ['autodocs']
	});

	const sampleData = [
		{ label: 'Jan', value: 42000 },
		{ label: 'Feb', value: 58000 },
		{ label: 'Mar', value: 51000 },
		{ label: 'Apr', value: 73000 },
		{ label: 'May', value: 68000 },
		{ label: 'Jun', value: 82000 }
	];
</script>

<Story name="Default">
	{#snippet template()}
		<div class="max-w-xl">
			<AreaChartCard
				title="Commission Trend"
				description="Last 6 months"
				data={sampleData}
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
		<div class="max-w-xl">
			<AreaChartCard title="Commission Trend" data={[]} />
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template()}
		<div class="max-w-xl">
			<AreaChartCard title="Commission Trend" data={sampleData} loading />
		</div>
	{/snippet}
</Story>
