<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Chip from './chip.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Chip',
		component: Chip,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: [
					'default',
					'secondary',
					'destructive',
					'outline',
					'ghost',
					'success',
					'error',
					'warning',
					'alert',
					'info',
					'disabled'
				],
				description: 'Visual style variant'
			}
		},
		args: { variant: 'default' }
	});
</script>

<!-- Default -->
<Story name="Default" args={{ variant: 'default' }}>
	{#snippet template(args)}
		<Chip {...args}>Default</Chip>
	{/snippet}
</Story>

<!-- Secondary -->
<Story name="Secondary" args={{ variant: 'secondary' }}>
	{#snippet template(args)}
		<Chip {...args}>Secondary</Chip>
	{/snippet}
</Story>

<!-- Destructive -->
<Story name="Destructive" args={{ variant: 'destructive' }}>
	{#snippet template(args)}
		<Chip {...args}>Destructive</Chip>
	{/snippet}
</Story>

<!-- Outline -->
<Story name="Outline" args={{ variant: 'outline' }}>
	{#snippet template(args)}
		<Chip {...args}>Outline</Chip>
	{/snippet}
</Story>

<!-- Ghost -->
<Story name="Ghost" args={{ variant: 'ghost' }}>
	{#snippet template(args)}
		<Chip {...args}>Ghost</Chip>
	{/snippet}
</Story>

<!-- Success -->
<Story name="Success" args={{ variant: 'success' }}>
	{#snippet template(args)}
		<Chip {...args}>Success</Chip>
	{/snippet}
</Story>

<!-- Error -->
<Story name="Error" args={{ variant: 'error' }}>
	{#snippet template(args)}
		<Chip {...args}>Error</Chip>
	{/snippet}
</Story>

<!-- Warning -->
<Story name="Warning" args={{ variant: 'warning' }}>
	{#snippet template(args)}
		<Chip {...args}>Warning</Chip>
	{/snippet}
</Story>

<!-- Alert -->
<Story name="Alert" args={{ variant: 'alert' }}>
	{#snippet template(args)}
		<Chip {...args}>Alert</Chip>
	{/snippet}
</Story>

<!-- Info -->
<Story name="Info" args={{ variant: 'info' }}>
	{#snippet template(args)}
		<Chip {...args}>Info</Chip>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ variant: 'disabled' }}>
	{#snippet template(args)}
		<Chip {...args}>Disabled</Chip>
	{/snippet}
</Story>

<!-- All Variants -->
<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-wrap gap-2">
			<Chip variant="default">Default</Chip>
			<Chip variant="secondary">Secondary</Chip>
			<Chip variant="destructive">Destructive</Chip>
			<Chip variant="outline">Outline</Chip>
			<Chip variant="ghost">Ghost</Chip>
			<Chip variant="success">Success</Chip>
			<Chip variant="error">Error</Chip>
			<Chip variant="warning">Warning</Chip>
			<Chip variant="alert">Alert</Chip>
			<Chip variant="info">Info</Chip>
			<Chip variant="disabled">Disabled</Chip>
		</div>
	{/snippet}
</Story>

<!-- Status Chips -->
<Story name="Status Chips">
	{#snippet template()}
		<div class="flex flex-wrap gap-2">
			<Chip variant="success">Active</Chip>
			<Chip variant="warning">Pending</Chip>
			<Chip variant="error">Failed</Chip>
			<Chip variant="info">Processing</Chip>
			<Chip variant="disabled">Inactive</Chip>
		</div>
	{/snippet}
</Story>
