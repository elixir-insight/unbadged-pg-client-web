<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Input from './input.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Input',
		component: Input,
		tags: ['autodocs'],
		argTypes: {
			type: {
				control: 'select',
				options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
				description: 'HTML input type'
			},
			placeholder: { control: 'text', description: 'Placeholder text' },
			disabled: { control: 'boolean', description: 'Disables the input' },
			value: { control: 'text', description: 'Input value' }
		},
		args: {
			type: 'text',
			placeholder: 'Enter text…',
			disabled: false,
			value: ''
		}
	});
</script>

<!-- Default -->
<Story name="Default" args={{ type: 'text', placeholder: 'Enter text…' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Input {...args} />
		</div>
	{/snippet}
</Story>

<!-- Email -->
<Story name="Email" args={{ type: 'email', placeholder: 'name@example.com' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Input {...args} />
		</div>
	{/snippet}
</Story>

<!-- Password -->
<Story name="Password" args={{ type: 'password', placeholder: 'Enter password…' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Input {...args} />
		</div>
	{/snippet}
</Story>

<!-- Number -->
<Story name="Number" args={{ type: 'number', placeholder: '0' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Input {...args} />
		</div>
	{/snippet}
</Story>

<!-- With Value -->
<Story name="With Value" args={{ value: 'Jane Doe', placeholder: 'Enter name…' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Input {...args} />
		</div>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true, placeholder: 'Cannot edit this' }}>
	{#snippet template(args)}
		<div class="w-72">
			<Input {...args} />
		</div>
	{/snippet}
</Story>

<!-- Error / Invalid -->
<Story name="Error">
	{#snippet template()}
		<div class="w-72">
			<Input aria-invalid="true" placeholder="Invalid input" value="bad@" />
		</div>
	{/snippet}
</Story>

<!-- All Types -->
<Story name="All Types">
	{#snippet template()}
		<div class="flex w-72 flex-col gap-3">
			<Input type="text" placeholder="Text" />
			<Input type="email" placeholder="Email" />
			<Input type="password" placeholder="Password" />
			<Input type="number" placeholder="Number" />
			<Input type="tel" placeholder="Phone" />
			<Input type="url" placeholder="https://example.com" />
		</div>
	{/snippet}
</Story>
