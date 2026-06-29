<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './button.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Button',
		component: Button,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
				description: 'Visual style variant of the button'
			},
			size: {
				control: 'select',
				options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
				description: 'Size of the button'
			},
			disabled: {
				control: 'boolean',
				description: 'Disables the button'
			}
		},
		args: {
			variant: 'default',
			size: 'default',
			disabled: false
		}
	});
</script>

<!-- Default -->
<Story name="Default" args={{ variant: 'default', size: 'default' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Outline -->
<Story name="Outline" args={{ variant: 'outline' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Secondary -->
<Story name="Secondary" args={{ variant: 'secondary' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Ghost -->
<Story name="Ghost" args={{ variant: 'ghost' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Destructive -->
<Story name="Destructive" args={{ variant: 'destructive' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Link -->
<Story name="Link" args={{ variant: 'link' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- Sizes -->
<Story name="Size XS" args={{ size: 'xs' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<Story name="Size SM" args={{ size: 'sm' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<Story name="Size LG" args={{ size: 'lg' }}>
	{#snippet template(args)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<!-- All Variants Side by Side -->
<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-wrap gap-3">
			<Button variant="default">Default</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="link">Link</Button>
		</div>
	{/snippet}
</Story>

<!-- All Sizes Side by Side -->
<Story name="All Sizes">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			<Button size="xs">Extra Small</Button>
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
		</div>
	{/snippet}
</Story>
