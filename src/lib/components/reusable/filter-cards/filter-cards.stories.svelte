<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FilterCards from './filter-cards.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/FilterCards',
		component: FilterCards,
		tags: ['autodocs'],
		argTypes: {
			cards: { control: 'object', description: 'Array of cards with label and count' },
			selected: { control: 'text', description: 'Label of the currently selected card' },
			loading: { control: 'boolean', description: 'Show skeleton loading state' },
			skeletonCount: { control: 'number', description: 'Number of skeleton cards to render' }
		}
	});

	const sampleCards = [
		{ label: 'All', count: 120 },
		{ label: 'Active', count: 45 },
		{ label: 'Pending', count: 18 },
		{ label: 'Completed', count: 42 },
		{ label: 'Failed', count: 10 },
		{ label: 'Refunded', count: 5 }
	];
</script>

<!-- Default — first card selected -->
<Story
	name="Default"
	args={{ cards: sampleCards, selected: 'All', class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6' }}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- None selected -->
<Story
	name="None Selected"
	args={{ cards: sampleCards, selected: '', class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6' }}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- Middle card selected -->
<Story
	name="Pending Selected"
	args={{
		cards: sampleCards,
		selected: 'Pending',
		class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
	}}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- Zero counts -->
<Story
	name="Zero Counts"
	args={{
		cards: [
			{ label: 'All', count: 0 },
			{ label: 'Active', count: 0 },
			{ label: 'Pending', count: 0 }
		],
		selected: 'All',
		class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
	}}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- Few cards (fewer than grid columns) -->
<Story
	name="Few Cards"
	args={{
		cards: [
			{ label: 'Open', count: 7 },
			{ label: 'Closed', count: 3 }
		],
		selected: 'Open',
		class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
	}}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- Skeleton loading — default 6 cards -->
<Story name="Loading" args={{ loading: true, class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6' }}>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- Skeleton with custom count -->
<Story
	name="Loading 3 Cards"
	args={{
		loading: true,
		skeletonCount: 3,
		class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 '
	}}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>

<!-- Large counts -->
<Story
	name="Large Counts"
	args={{
		cards: [
			{ label: 'All', count: 12847 },
			{ label: 'Settled', count: 9210 },
			{ label: 'Pending', count: 2184 },
			{ label: 'Failed', count: 1453 }
		],
		selected: 'All',
		class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
	}}
>
	{#snippet template(args)}
		<FilterCards {...args} />
	{/snippet}
</Story>
