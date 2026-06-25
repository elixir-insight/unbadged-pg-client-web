<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Checkbox from './checkbox.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Checkbox',
		component: Checkbox,
		tags: ['autodocs'],
		argTypes: {
			checked: { control: 'boolean', description: 'Checked state' },
			indeterminate: { control: 'boolean', description: 'Indeterminate state' },
			disabled: { control: 'boolean', description: 'Disables the checkbox' },
			label: { control: 'text', description: 'Label text beside the checkbox' },
			description: { control: 'text', description: 'Helper text below the label' }
		},
		args: {
			checked: false,
			indeterminate: false,
			disabled: false
		}
	});
</script>

<!-- Default -->
<Story name="Default" args={{ checked: false }}>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- Checked -->
<Story name="Checked" args={{ checked: true }}>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- Indeterminate -->
<Story name="Indeterminate" args={{ indeterminate: true }}>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true, checked: false }}>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- Disabled Checked -->
<Story name="Disabled Checked" args={{ disabled: true, checked: true }}>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- With Label -->
<Story name="With Label" args={{ label: 'Accept terms and conditions' }}>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- With Label and Description -->
<Story
	name="With Label and Description"
	args={{
		label: 'Marketing emails',
		description: 'Receive emails about new features, tips, and promotions.'
	}}
>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- Disabled With Label -->
<Story
	name="Disabled With Label"
	args={{ label: 'Feature flag (locked)', disabled: true, checked: false }}
>
	{#snippet template(args)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<!-- All States -->
<Story name="All States">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			<Checkbox label="Unchecked" />
			<Checkbox label="Checked" checked={true} />
			<Checkbox label="Indeterminate" indeterminate={true} />
			<Checkbox label="Disabled" disabled={true} />
			<Checkbox label="Disabled Checked" disabled={true} checked={true} />
		</div>
	{/snippet}
</Story>

<!-- With Descriptions (Form-like) -->
<Story name="Form Group">
	{#snippet template()}
		<div class="flex flex-col gap-5">
			<Checkbox
				label="Email notifications"
				description="Get notified about activity on your account."
				checked={true}
			/>
			<Checkbox
				label="SMS notifications"
				description="Receive text messages for important alerts."
			/>
			<Checkbox
				label="Push notifications"
				description="Browser push notifications are not available on this plan."
				disabled={true}
			/>
		</div>
	{/snippet}
</Story>
