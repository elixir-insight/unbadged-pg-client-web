<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SearchWithDropdown from './search-with-dropdown.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/SearchWithDropdown',
		component: SearchWithDropdown,
		tags: ['autodocs']
	});

	const options = [
		{
			value: 'p-001',
			label: 'Acme Payments',
			description: '12 merchants · Mumbai'
		},
		{
			value: 'p-002',
			label: 'Nova Fintech',
			description: '8 merchants · Bengaluru'
		},
		{
			value: 'p-003',
			label: 'Riverline Partners',
			description: '5 merchants · Delhi'
		}
	];

	const groupedOptions = [
		{
			group: 'Active',
			items: [
				{ value: 'p-001', label: 'Acme Payments', description: '12 merchants' },
				{ value: 'p-002', label: 'Nova Fintech', description: '8 merchants' }
			]
		},
		{
			group: 'Inactive',
			items: [
				{ value: 'p-004', label: 'Legacy Channel', description: '0 merchants', disabled: true }
			]
		}
	];
</script>

<Story name="Default">
	{#snippet template()}
		<div class="w-72">
			<SearchWithDropdown {options} placeholder="Select partner…" />
		</div>
	{/snippet}
</Story>

<Story name="Grouped">
	{#snippet template()}
		<div class="w-72">
			<SearchWithDropdown options={groupedOptions} placeholder="Select partner…" />
		</div>
	{/snippet}
</Story>

<Story name="Small">
	{#snippet template()}
		<div class="w-72">
			<SearchWithDropdown {options} placeholder="Select partner…" size="sm" />
		</div>
	{/snippet}
</Story>
