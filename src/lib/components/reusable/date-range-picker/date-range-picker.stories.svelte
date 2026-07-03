<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { CalendarDate } from '@internationalized/date';
	import DateRangePicker from './date-range-picker.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/DateRangePicker',
		component: DateRangePicker,
		tags: ['autodocs'],
		argTypes: {
			locale: { control: 'text', description: 'BCP 47 locale for date formatting' },
			class: { control: 'text', description: 'Extra CSS classes on the trigger' }
		},
		args: {
			locale: 'en-IN'
		}
	});
</script>

<!-- Default — no date selected, trigger shows placeholder -->
<Story name="Default">
	{#snippet template(args)}
		<div class="p-4">
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 7 Days — trigger shows preset label + formatted range -->
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
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 15 Days -->
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
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 30 Days -->
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
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: Past 90 Days -->
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
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- Pre-selected: custom range — no preset highlighted in the panel -->
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
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- With onApply callback — logs range + preset to the Actions panel -->
<Story name="With onApply Callback">
	{#snippet template(args)}
		<div class="p-4">
			<DateRangePicker
				{...args}
				onApply={(range, preset) => {
					console.log('Applied range:', range);
					console.log('Preset:', preset);
				}}
			/>
		</div>
	{/snippet}
</Story>

<!-- Custom width via class prop -->
<Story name="Custom Width" args={{ class: 'w-96' }}>
	{#snippet template(args)}
		<div class="p-4">
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>

<!-- en-US locale — dates formatted as MM/DD/YYYY -->
<Story name="en-US Locale" args={{ locale: 'en-US' }}>
	{#snippet template(args)}
		<div class="p-4">
			<DateRangePicker {...args} />
		</div>
	{/snippet}
</Story>
