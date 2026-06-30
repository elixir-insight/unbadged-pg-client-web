<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RangeCalendar from './range-calendar.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/RangeCalendar',
		component: RangeCalendar,
		tags: ['autodocs'],
		argTypes: {
			label: { control: 'text' },
			placeholder: { control: 'text' },
			disabled: { control: 'boolean' },
			readonly: { control: 'boolean' },
			numberOfMonths: { control: 'select', options: [1, 2] }
		},
		args: {
			placeholder: 'Select date range',
			disabled: false,
			readonly: false,
			numberOfMonths: 1
		}
	});
</script>

<!-- Default (empty, single month) -->
<Story name="Default" args={{ placeholder: 'Select date range' }}>
	{#snippet template(args)}
		<div class="w-72 h-90">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- With label -->
<Story name="With Label" args={{ label: 'Date Range', placeholder: 'Pick a range…' }}>
	{#snippet template(args)}
		<div class="w-72 h-90">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Two months -->
<Story name="Two Months" args={{ label: 'Period', numberOfMonths: 2 }}>
	{#snippet template(args)}
		<div class="w-72 h-90">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ label: 'Date Range', disabled: true }}>
	{#snippet template(args)}
		<div class="w-72 h-90">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Read-only -->
<Story name="Read Only" args={{ label: 'Date Range', readonly: true }}>
	{#snippet template(args)}
		<div class="w-72 h-90">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>
