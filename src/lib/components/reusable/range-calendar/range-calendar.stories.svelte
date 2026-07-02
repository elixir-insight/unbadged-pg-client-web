<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { CalendarDate } from '@internationalized/date';
	import RangeCalendar from './range-calendar.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/RangeCalendar',
		component: RangeCalendar,
		tags: ['autodocs'],
		argTypes: {
			locale: { control: 'text', description: 'BCP 47 locale for date formatting' },
			class: { control: 'text', description: 'Extra CSS classes on the trigger button' }
		},
		args: {
			locale: 'en-IN'
		}
	});
</script>

<!-- Default — no date selected -->
<Story name="Default">
	{#snippet template(args)}
		<div class="p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 7 days (preset highlight auto-detected) -->
<Story
	name="Past 7 Days Selected"
	args={{
		value: {
			start: new CalendarDate(2026, 6, 24),
			end: new CalendarDate(2026, 6, 30)
		}
	}}
>
	{#snippet template(args)}
		<div class="p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 15 days -->
<Story
	name="Past 15 Days Selected"
	args={{
		value: {
			start: new CalendarDate(2026, 6, 16),
			end: new CalendarDate(2026, 6, 30)
		}
	}}
>
	{#snippet template(args)}
		<div class="p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 30 days -->
<Story
	name="Past 30 Days Selected"
	args={{
		value: {
			start: new CalendarDate(2026, 6, 1),
			end: new CalendarDate(2026, 6, 30)
		}
	}}
>
	{#snippet template(args)}
		<div class="p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 90 days -->
<Story
	name="Past 90 Days Selected"
	args={{
		value: {
			start: new CalendarDate(2026, 4, 2),
			end: new CalendarDate(2026, 6, 30)
		}
	}}
>
	{#snippet template(args)}
		<div class="p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: custom range (no preset highlighted) -->
<Story
	name="Custom Range Selected"
	args={{
		value: {
			start: new CalendarDate(2026, 5, 10),
			end: new CalendarDate(2026, 6, 5)
		}
	}}
>
	{#snippet template(args)}
		<div class="p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>

<!-- Custom trigger width via class -->
<Story name="Full Width" args={{ class: 'w-full' }}>
	{#snippet template(args)}
		<div class="max-w-md p-4">
			<RangeCalendar {...args} />
		</div>
	{/snippet}
</Story>
