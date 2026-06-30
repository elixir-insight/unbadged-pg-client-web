<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Tooltip from './tooltip.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Tooltip',
		component: Tooltip,
		tags: ['autodocs'],
		argTypes: {
			content: { control: 'text', description: 'Tooltip text' },
			side: {
				control: 'select',
				options: ['top', 'right', 'bottom', 'left'],
				description: 'Side the tooltip appears on'
			},
			delayDuration: { control: 'number', description: 'Hover delay in ms' }
		},
		args: {
			content: 'Tooltip text',
			side: 'top',
			delayDuration: 0
		}
	});
</script>

<script>
	import InfoIcon from '@lucide/svelte/icons/info';
	import HelpCircleIcon from '@lucide/svelte/icons/circle-help';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { Button } from '$lib/components/reusable';
</script>

<!-- Without Icon — text trigger -->
<Story name="Without Icon" args={{ content: 'This is a tooltip', side: 'top' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args}>
				<Button variant="outline">Hover me</Button>
			</Tooltip>
		</div>
	{/snippet}
</Story>

<!-- With Icon — icon-only trigger -->
<Story name="With Icon" args={{ content: 'More information about this field', side: 'top' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={InfoIcon} />
		</div>
	{/snippet}
</Story>

<!-- Help Icon -->
<Story name="Help Icon" args={{ content: 'Click here if you need assistance', side: 'top' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={HelpCircleIcon} />
		</div>
	{/snippet}
</Story>

<!-- Warning Icon -->
<Story name="Warning Icon" args={{ content: 'This action cannot be undone', side: 'top' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={AlertCircleIcon} />
		</div>
	{/snippet}
</Story>

<!-- Side — Top -->
<Story name="Side Top" args={{ content: 'Appears above', side: 'top' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={InfoIcon} />
		</div>
	{/snippet}
</Story>

<!-- Side — Bottom -->
<Story name="Side Bottom" args={{ content: 'Appears below', side: 'bottom' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={InfoIcon} />
		</div>
	{/snippet}
</Story>

<!-- Side — Left -->
<Story name="Side Left" args={{ content: 'Appears to the left', side: 'left' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={InfoIcon} />
		</div>
	{/snippet}
</Story>

<!-- Side — Right -->
<Story name="Side Right" args={{ content: 'Appears to the right', side: 'right' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={InfoIcon} />
		</div>
	{/snippet}
</Story>

<!-- With Delay -->
<Story
	name="With Delay"
	args={{ content: 'Delayed tooltip (500ms)', side: 'top', delayDuration: 500 }}
>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Tooltip {...args} icon={InfoIcon} />
		</div>
	{/snippet}
</Story>

<!-- All Sides -->
<Story name="All Sides">
	{#snippet template()}
		<div class="grid h-48 place-items-center">
			<div class="flex items-center gap-10">
				<Tooltip content="Left side" side="left" icon={InfoIcon} />
				<div class="flex flex-col items-center gap-10">
					<Tooltip content="Top side" side="top" icon={InfoIcon} />
					<Tooltip content="Bottom side" side="bottom" icon={InfoIcon} />
				</div>
				<Tooltip content="Right side" side="right" icon={InfoIcon} />
			</div>
		</div>
	{/snippet}
</Story>

<!-- Inline Usage — mixed triggers -->
<Story name="Inline Usage">
	{#snippet template()}
		<div class="flex items-center gap-6 rounded-lg border p-6">
			<span class="text-sm font-medium">Transaction limit</span>
			<Tooltip content="Maximum single transaction amount for this account tier." icon={InfoIcon} />
			<Button variant="outline" size="sm">
				<SettingsIcon class="mr-1.5 size-3.5" />
				Configure
			</Button>
			<Tooltip content="Opens account settings">
				<HelpCircleIcon class="size-4 text-muted-foreground" />
			</Tooltip>
		</div>
	{/snippet}
</Story>
