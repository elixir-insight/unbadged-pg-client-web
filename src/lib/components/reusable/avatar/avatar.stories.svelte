<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Avatar from './avatar.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Avatar',
		component: Avatar,
		tags: ['autodocs'],
		argTypes: {
			name: { control: 'text', description: 'Full name used for initials fallback' },
			src: { control: 'text', description: 'Image URL' },
			size: {
				control: 'select',
				options: ['sm', 'default', 'lg'],
				description: 'Avatar size'
			},
			shape: {
				control: 'select',
				options: ['circle', 'square'],
				description: 'Avatar shape'
			}
		},
		args: { name: 'Aarav Kapoor', size: 'default', shape: 'square' }
	});
</script>

<!-- Initials only (no image) -->
<Story name="Initials" args={{ name: 'Aarav Kapoor' }}>
	{#snippet template(args)}
		<Avatar
			name={args.name}
			src={args.src}
			size={args.size}
			shape={args.shape}
			class={args.class}
		/>
	{/snippet}
</Story>

<!-- With image -->
<Story
	name="With Image"
	args={{ name: 'Jane Doe', src: 'https://i.pravatar.cc/150?img=47', shape: 'circle' }}
>
	{#snippet template(args)}
		<Avatar
			name={args.name}
			src={args.src}
			size={args.size}
			shape={args.shape}
			class={args.class}
		/>
	{/snippet}
</Story>

<!-- Circle shape -->
<Story name="Circle" args={{ name: 'Rahul Mehta', shape: 'circle' }}>
	{#snippet template(args)}
		<Avatar
			name={args.name}
			src={args.src}
			size={args.size}
			shape={args.shape}
			class={args.class}
		/>
	{/snippet}
</Story>

<!-- Sizes -->
<Story name="Size SM" args={{ name: 'Priya Singh', size: 'sm' }}>
	{#snippet template(args)}
		<Avatar
			name={args.name}
			src={args.src}
			size={args.size}
			shape={args.shape}
			class={args.class}
		/>
	{/snippet}
</Story>

<Story name="Size LG" args={{ name: 'Vikram Nair', size: 'lg' }}>
	{#snippet template(args)}
		<Avatar
			name={args.name}
			src={args.src}
			size={args.size}
			shape={args.shape}
			class={args.class}
		/>
	{/snippet}
</Story>

<!-- All sizes side by side -->
<Story name="All Sizes">
	{#snippet template()}
		<div class="flex items-center gap-4">
			<Avatar name="Small" size="sm" />
			<Avatar name="Default" size="default" />
			<Avatar name="Large" size="lg" />
		</div>
	{/snippet}
</Story>

<!-- All shapes side by side -->
<Story name="All Shapes">
	{#snippet template()}
		<div class="flex items-center gap-4">
			<Avatar name="Square Shape" shape="square" />
			<Avatar name="Circle Shape" shape="circle" />
		</div>
	{/snippet}
</Story>
