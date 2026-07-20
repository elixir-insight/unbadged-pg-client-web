<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RadialSpiralChart from './radial-spiral-chart.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/RadialSpiralChart',
		component: RadialSpiralChart,
		tags: ['autodocs']
	});

	const refundSegments = [
		{ label: 'Completed', value: 18, color: 'var(--color-chart-1)' },
		{ label: 'Initiated', value: 5, color: 'var(--color-chart-2)' },
		{ label: 'Failed', value: 2, color: 'var(--color-chart-3)' }
	];

	const disputeSegments = [
		{ label: 'Open', value: 12, color: 'var(--color-chart-1)' },
		{ label: 'Pending', value: 7, color: 'var(--color-chart-2)' },
		{ label: 'Resolved', value: 21, color: 'var(--color-chart-3)' },
		{ label: 'Escalated', value: 3, color: 'var(--color-chart-4)' }
	];
</script>

<!-- Default -->
<Story name="Default" args={{ segments: refundSegments, unitLabel: 'refunds' }}>
	{#snippet template(args)}
		<div style="height: 200px;">
			<RadialSpiralChart {...args} />
		</div>
	{/snippet}
</Story>

<!-- Four segments -->
<Story name="FourSegments" args={{ segments: disputeSegments, unitLabel: 'disputes' }}>
	{#snippet template(args)}
		<div style="height: 200px;">
			<RadialSpiralChart {...args} />
		</div>
	{/snippet}
</Story>

<!-- Explicit total override -->
<Story
	name="ExplicitTotal"
	args={{ segments: refundSegments, total: 25, unitLabel: 'of 25 refunds' }}
>
	{#snippet template(args)}
		<div style="height: 200px;">
			<RadialSpiralChart {...args} />
		</div>
	{/snippet}
</Story>
