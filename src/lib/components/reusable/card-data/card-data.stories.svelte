<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CardData from './card-data.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/CardData',
		component: CardData,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	{#snippet template()}
		<div class="w-64">
			<CardData label="Total Commission" value="₹4,82,500" subText="Across 12 merchants" />
		</div>
	{/snippet}
</Story>

<Story name="With Trend">
	{#snippet template()}
		<div class="w-64">
			<CardData
				label="This Month"
				value="₹1,24,000"
				trend="up"
				trendLabel="+18.4%"
				subText="vs last month"
			/>
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template()}
		<div class="w-64">
			<CardData label="Total Commission" value="—" loading />
		</div>
	{/snippet}
</Story>
