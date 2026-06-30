<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Search from './search.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Search',
		component: Search,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text' },
			variant: { control: 'select', options: ['borderless', 'bordered'] },
			value: { control: 'text' }
		},
		args: { placeholder: 'Search…', variant: 'borderless', value: '' }
	});
</script>

<!-- Borderless (default) -->
<Story name="Borderless" args={{ variant: 'borderless' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Search {...args} />
		</div>
	{/snippet}
</Story>

<!-- Bordered -->
<Story name="Bordered" args={{ variant: 'bordered' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Search {...args} />
		</div>
	{/snippet}
</Story>

<!-- Custom placeholder -->
<Story
	name="Custom Placeholder"
	args={{ placeholder: 'Search transactions…', variant: 'bordered' }}
>
	{#snippet template(args)}
		<div class="w-72">
			<Search {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-filled value -->
<Story name="With Value" args={{ value: 'Aarav', variant: 'bordered' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Search {...args} />
		</div>
	{/snippet}
</Story>

<!-- All variants side by side -->
<Story name="All Variants">
	{#snippet template()}
		<div class="flex w-full max-w-xl flex-col gap-4">
			<Search variant="borderless" placeholder="Borderless (default)" />
			<Search variant="bordered" placeholder="Bordered" />
		</div>
	{/snippet}
</Story>
