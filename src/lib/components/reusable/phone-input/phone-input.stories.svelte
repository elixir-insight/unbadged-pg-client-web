<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PhoneInput from './phone-input.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/PhoneInput',
		component: PhoneInput,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text', description: 'Placeholder text' },
			disabled: { control: 'boolean', description: 'Disables the input' },
			invalid: { control: 'boolean', description: 'Shows error styling' },
			value: { control: 'text', description: 'Phone number (10 digits, without country code)' }
		},
		args: {
			placeholder: '',
			disabled: false,
			invalid: false,
			value: ''
		}
	});
</script>

<Story name="Default">
	{#snippet template(args)}
		<div class="w-72">
			<PhoneInput {...args} />
		</div>
	{/snippet}
</Story>

<Story name="With Value" args={{ value: '9876543210' }}>
	{#snippet template(args)}
		<div class="w-72">
			<PhoneInput {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Invalid" args={{ value: '12345', invalid: true }}>
	{#snippet template(args)}
		<div class="w-72">
			<PhoneInput {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true, value: '9876543210' }}>
	{#snippet template(args)}
		<div class="w-72">
			<PhoneInput {...args} />
		</div>
	{/snippet}
</Story>
