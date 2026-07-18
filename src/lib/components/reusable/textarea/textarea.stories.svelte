<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Textarea from './textarea.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Textarea',
		component: Textarea,
		tags: ['autodocs'],
		argTypes: {
			label: { control: 'text', description: 'Label rendered above the textarea' },
			required: { control: 'boolean', description: 'Shows a required asterisk next to the label' },
			placeholder: { control: 'text', description: 'Placeholder text' },
			disabled: { control: 'boolean', description: 'Disables the textarea' },
			rows: { control: 'number', description: 'Number of visible text rows' },
			value: { control: 'text', description: 'Textarea value' }
		},
		args: {
			placeholder: 'Enter text…',
			disabled: false,
			value: ''
		}
	});
</script>

<!-- Default -->
<Story name="Default" args={{ placeholder: 'Enter description…' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Textarea {...args} />
		</div>
	{/snippet}
</Story>

<!-- With Value -->
<Story name="With Value" args={{ value: 'This is some pre-filled text.' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Textarea {...args} />
		</div>
	{/snippet}
</Story>

<!-- Custom Rows -->
<Story name="Custom Rows" args={{ rows: 6, placeholder: 'A taller textarea…' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Textarea {...args} />
		</div>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true, placeholder: 'Cannot edit this' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Textarea {...args} />
		</div>
	{/snippet}
</Story>

<!-- Error / Invalid -->
<Story name="Error">
	{#snippet template()}
		<div class="w-72">
			<Textarea aria-invalid="true" placeholder="Invalid input" value="Something's wrong." />
		</div>
	{/snippet}
</Story>

<!-- With Label -->
<Story name="With Label" args={{ label: 'Description', placeholder: 'Enter description…' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Textarea {...args} />
		</div>
	{/snippet}
</Story>

<!-- Required -->
<Story
	name="Required"
	args={{ label: 'Description', required: true, placeholder: 'Enter description…' }}
>
	{#snippet template(args)}
		<div class="w-72">
			<Textarea {...args} />
		</div>
	{/snippet}
</Story>
