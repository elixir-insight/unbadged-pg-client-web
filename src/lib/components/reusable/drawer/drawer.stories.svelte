<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Drawer from './drawer.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Drawer',
		component: Drawer,
		tags: ['autodocs'],
		argTypes: {
			title: { control: 'text', description: 'Drawer title' },
			description: { control: 'text', description: 'Drawer description' },
			direction: {
				control: 'select',
				options: ['bottom', 'top', 'left', 'right'],
				description: 'Side the drawer slides in from'
			},
			open: { control: 'boolean', description: 'Controls open state' }
		},
		args: { title: 'Drawer Title', open: true, direction: 'bottom' }
	});
</script>

<script>
	import { Button } from '$lib/components/reusable';
</script>

<!-- Default bottom drawer -->
<Story name="Default" args={{ title: 'Bottom Drawer', open: true, direction: 'bottom' }}>
	{#snippet template(args)}
		<Drawer {...args}>
			<p class="text-sm text-muted-foreground">This is the drawer body content.</p>
		</Drawer>
	{/snippet}
</Story>

<!-- With description -->
<Story
	name="With Description"
	args={{
		title: 'Account Settings',
		description: 'Manage your account preferences and configuration.',
		open: true,
		direction: 'bottom'
	}}
>
	{#snippet template(args)}
		<Drawer {...args}>
			<p class="text-sm text-muted-foreground">Configure your preferences here.</p>
		</Drawer>
	{/snippet}
</Story>

<!-- Right side drawer -->
<Story name="Right Side" args={{ title: 'Filters', open: true, direction: 'right' }}>
	{#snippet template(args)}
		<Drawer {...args}>
			<p class="text-sm text-muted-foreground">This drawer slides in from the right side.</p>
		</Drawer>
	{/snippet}
</Story>

<!-- Left side drawer -->
<Story name="Left Side" args={{ title: 'Navigation', open: true, direction: 'left' }}>
	{#snippet template(args)}
		<Drawer {...args}>
			<p class="text-sm text-muted-foreground">This drawer slides in from the left side.</p>
		</Drawer>
	{/snippet}
</Story>

<!-- Top drawer -->
<Story name="Top" args={{ title: 'Notification', open: true, direction: 'top' }}>
	{#snippet template(args)}
		<Drawer {...args}>
			<p class="text-sm text-muted-foreground">This drawer slides in from the top.</p>
		</Drawer>
	{/snippet}
</Story>

<!-- With footer actions -->
<Story name="With Footer" args={{ title: 'Confirm Action', open: true, direction: 'bottom' }}>
	{#snippet template(args)}
		<Drawer {...args}>
			<p class="text-sm text-muted-foreground">
				Are you sure you want to proceed? This action cannot be undone.
			</p>
			{#snippet footer()}
				<Button variant="outline">Cancel</Button>
				<Button>Confirm</Button>
			{/snippet}
		</Drawer>
	{/snippet}
</Story>

<!-- With trigger button -->
<Story name="With Trigger" args={{ title: 'Open via Trigger', open: false, direction: 'bottom' }}>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Drawer {...args}>
				{#snippet trigger()}
					<Button>Open Drawer</Button>
				{/snippet}
				<p class="text-sm text-muted-foreground">This drawer was opened via a trigger button.</p>
			</Drawer>
		</div>
	{/snippet}
</Story>

<!-- Right side with trigger -->
<Story
	name="Right Side With Trigger"
	args={{
		title: 'Filter Results',
		description: 'Narrow down your search results.',
		open: false,
		direction: 'right'
	}}
>
	{#snippet template(args)}
		<div class="flex h-24 items-center justify-center">
			<Drawer {...args}>
				{#snippet trigger()}
					<Button variant="outline">Open Filters</Button>
				{/snippet}
				<div class="space-y-3">
					<p class="text-sm font-medium">Status</p>
					<div class="flex flex-col gap-1.5 text-sm text-muted-foreground">
						<label class="flex items-center gap-2">
							<input type="checkbox" /> Active
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" /> Pending
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" /> Archived
						</label>
					</div>
				</div>
				{#snippet footer()}
					<Button variant="outline" class="flex-1">Reset</Button>
					<Button class="flex-1">Apply</Button>
				{/snippet}
			</Drawer>
		</div>
	{/snippet}
</Story>
