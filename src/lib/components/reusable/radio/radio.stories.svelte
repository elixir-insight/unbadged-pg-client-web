<script module lang="ts">
	import type { ComponentProps } from 'svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Radio from './radio.svelte';

	type RadioProps = ComponentProps<typeof Radio>;

	const { Story } = defineMeta({
		title: 'Reusable/Radio',
		component: Radio,
		tags: ['autodocs'],
		argTypes: {
			value: { control: 'text', description: 'Currently selected value' },
			orientation: {
				control: 'select',
				options: ['vertical', 'horizontal'],
				description: 'Layout direction of the radio group'
			},
			disabled: { control: 'boolean', description: 'Disables all radio items' }
		},
		args: {
			value: '',
			orientation: 'vertical',
			disabled: false,
			options: [
				{ value: 'option-1', label: 'Option 1' },
				{ value: 'option-2', label: 'Option 2' },
				{ value: 'option-3', label: 'Option 3' }
			]
		}
	});
</script>

<!-- Default -->
<Story name="Default">
	{#snippet template(args: RadioProps)}
		<Radio {...args} />
	{/snippet}
</Story>

<!-- Pre-selected -->
<Story name="Pre-selected" args={{ value: 'option-2' }}>
	{#snippet template(args: RadioProps)}
		<Radio {...args} />
	{/snippet}
</Story>

<!-- Horizontal -->
<Story name="Horizontal" args={{ orientation: 'horizontal', value: 'option-1' }}>
	{#snippet template(args: RadioProps)}
		<Radio {...args} />
	{/snippet}
</Story>

<!-- Disabled Group -->
<Story name="Disabled" args={{ disabled: true, value: 'option-1' }}>
	{#snippet template(args: RadioProps)}
		<Radio {...args} />
	{/snippet}
</Story>

<!-- With Descriptions -->
<Story name="With Descriptions">
	{#snippet template()}
		<Radio
			value="starter"
			options={[
				{
					value: 'starter',
					label: 'Starter',
					description: 'Perfect for individuals and small projects.'
				},
				{
					value: 'pro',
					label: 'Pro',
					description: 'Advanced features for growing teams.'
				},
				{
					value: 'enterprise',
					label: 'Enterprise',
					description: 'Unlimited access with dedicated support.'
				}
			]}
		/>
	{/snippet}
</Story>

<!-- Mixed Disabled Options -->
<Story name="Mixed Disabled">
	{#snippet template()}
		<Radio
			value="monthly"
			options={[
				{ value: 'monthly', label: 'Monthly billing' },
				{ value: 'yearly', label: 'Yearly billing (save 20%)' },
				{ value: 'enterprise', label: 'Enterprise pricing', disabled: true }
			]}
		/>
	{/snippet}
</Story>

<!-- Horizontal with Descriptions -->
<Story name="Horizontal with Descriptions">
	{#snippet template()}
		<Radio
			orientation="horizontal"
			value="card"
			options={[
				{ value: 'card', label: 'Card', description: 'Credit or debit card' },
				{ value: 'bank', label: 'Bank transfer', description: 'Direct bank transfer' },
				{ value: 'wallet', label: 'Wallet', description: 'Digital wallet' }
			]}
		/>
	{/snippet}
</Story>
