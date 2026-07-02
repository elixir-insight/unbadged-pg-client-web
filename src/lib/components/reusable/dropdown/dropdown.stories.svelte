<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Dropdown from './dropdown.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Dropdown',
		component: Dropdown,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text' },
			disabled: { control: 'boolean' },
			bordered: { control: 'boolean' },
			search: { control: 'boolean' },
			size: { control: 'select', options: ['default', 'sm'] }
		},
		args: { placeholder: 'Select an option…', disabled: false, bordered: false, search: false }
	});

	const flatOptions = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'editor', label: 'Editor' },
		{ value: 'viewer', label: 'Viewer' },
		{ value: 'guest', label: 'Guest', disabled: true }
	];

	const groupedOptions = [
		{
			group: 'Internal',
			items: [
				{ value: 'admin', label: 'Admin' },
				{ value: 'editor', label: 'Editor' }
			]
		},
		{
			group: 'External',
			items: [
				{ value: 'client', label: 'Client' },
				{ value: 'partner', label: 'Partner' }
			]
		}
	];
</script>

<!-- Basic flat options -->
<Story name="Default" args={{ options: flatOptions }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>

<!-- Grouped options -->
<Story name="Grouped Options" args={{ options: groupedOptions }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>

<!-- With search -->
<Story name="With Search" args={{ options: flatOptions, search: true }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>

<!-- Grouped + search -->
<Story name="Grouped With Search" args={{ options: groupedOptions, search: true }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ options: flatOptions, disabled: true }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>

<!-- Bordered -->
<Story name="Bordered" args={{ options: flatOptions, bordered: true }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>

<!-- Small size -->
<Story name="Small" args={{ options: flatOptions, size: 'sm' }}>
	{#snippet template(args)}
		<div class="w-64">
			<Dropdown {...args} />
		</div>
	{/snippet}
</Story>
