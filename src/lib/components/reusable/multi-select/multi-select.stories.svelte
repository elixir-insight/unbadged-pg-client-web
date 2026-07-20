<script module lang="ts">
	import type { ComponentProps } from 'svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MultiSelect from './multi-select.svelte';

	type MultiSelectProps = ComponentProps<typeof MultiSelect>;

	const { Story } = defineMeta({
		title: 'Reusable/MultiSelect',
		component: MultiSelect,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text' },
			disabled: { control: 'boolean' }
		},
		args: { placeholder: 'Select options…', disabled: false }
	});

	const options = [
		{ value: 'react', label: 'React' },
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'vue', label: 'Vue' },
		{ value: 'angular', label: 'Angular' },
		{ value: 'solid', label: 'SolidJS', disabled: true }
	];
</script>

<!-- Empty selection -->
<Story name="Empty" args={{ options, placeholder: 'Select frameworks…' }}>
	{#snippet template(args: MultiSelectProps)}
		<div class="w-80">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected values -->
<Story name="Pre-selected" args={{ options, value: ['react', 'svelte'] }}>
	{#snippet template(args: MultiSelectProps)}
		<div class="w-80">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>

<!-- With disabled option -->
<Story name="With Disabled Option" args={{ options }}>
	{#snippet template(args: MultiSelectProps)}
		<div class="w-80">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>

<!-- Disabled trigger -->
<Story name="Disabled" args={{ options, disabled: true }}>
	{#snippet template(args: MultiSelectProps)}
		<div class="w-80">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>
