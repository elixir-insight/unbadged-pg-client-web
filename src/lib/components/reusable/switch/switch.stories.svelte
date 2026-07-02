<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Switch from './switch.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Switch',
		component: Switch,
		tags: ['autodocs'],
		argTypes: {
			checked: { control: 'boolean', description: 'Checked state' },
			disabled: { control: 'boolean', description: 'Disables the switch' },
			size: {
				control: 'select',
				options: ['default', 'sm'],
				description: 'Size variant'
			}
		},
		args: {
			checked: false,
			disabled: false,
			size: 'default'
		}
	});
</script>

<!-- Default (unchecked) -->
<Story name="Default" args={{ checked: false }}>
	{#snippet template(args)}
		<Switch {...args} />
	{/snippet}
</Story>

<!-- Checked -->
<Story name="Checked" args={{ checked: true }}>
	{#snippet template(args)}
		<Switch {...args} />
	{/snippet}
</Story>

<!-- Small unchecked -->
<Story name="Small" args={{ size: 'sm', checked: false }}>
	{#snippet template(args)}
		<Switch {...args} />
	{/snippet}
</Story>

<!-- Small checked -->
<Story name="Small Checked" args={{ size: 'sm', checked: true }}>
	{#snippet template(args)}
		<Switch {...args} />
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true, checked: false }}>
	{#snippet template(args)}
		<Switch {...args} />
	{/snippet}
</Story>

<!-- Disabled Checked -->
<Story name="Disabled Checked" args={{ disabled: true, checked: true }}>
	{#snippet template(args)}
		<Switch {...args} />
	{/snippet}
</Story>

<!-- With Label -->
<Story name="With Label">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			<label class="flex cursor-pointer items-center gap-3">
				<Switch />
				<span class="text-sm font-medium">Enable notifications</span>
			</label>
			<label class="flex cursor-pointer items-center gap-3">
				<Switch checked={true} />
				<span class="text-sm font-medium">Dark mode</span>
			</label>
			<label class="flex cursor-pointer items-center gap-3 opacity-50">
				<Switch disabled={true} />
				<span class="text-sm font-medium">Feature flag (locked)</span>
			</label>
		</div>
	{/snippet}
</Story>

<!-- All Sizes -->
<Story name="All Sizes">
	{#snippet template()}
		<div class="flex items-center gap-6">
			<div class="flex flex-col items-center gap-2">
				<Switch size="default" />
				<span class="text-muted-foreground text-xs">Default</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Switch size="sm" />
				<span class="text-muted-foreground text-xs">Small</span>
			</div>
		</div>
	{/snippet}
</Story>

<!-- All States -->
<Story name="All States">
	{#snippet template()}
		<div class="flex items-center gap-6">
			<div class="flex flex-col items-center gap-2">
				<Switch checked={false} />
				<span class="text-muted-foreground text-xs">Off</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Switch checked={true} />
				<span class="text-muted-foreground text-xs">On</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Switch disabled={true} checked={false} />
				<span class="text-muted-foreground text-xs">Disabled Off</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Switch disabled={true} checked={true} />
				<span class="text-muted-foreground text-xs">Disabled On</span>
			</div>
		</div>
	{/snippet}
</Story>
