<script module lang="ts">
	import type { ComponentProps } from 'svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProfileCard from './profile-card.svelte';

	type ProfileCardProps = ComponentProps<typeof ProfileCard>;

	const { Story } = defineMeta({
		title: 'Reusable/ProfileCard',
		component: ProfileCard,
		tags: ['autodocs'],
		argTypes: {
			userName: { control: 'text' },
			userRole: { control: 'text' },
			userInitials: { control: 'text' },
			vanNumber: { control: 'text' },
			isCollapsed: { control: 'boolean', description: 'Show icon-only collapsed state' }
		},
		args: {
			userName: 'Aarav Kapoor',
			userRole: 'Admin',
			userInitials: 'AK',
			vanNumber: 'VAN-2024-00123',
			isCollapsed: false
		}
	});
</script>

<!-- Expanded (default sidebar state) -->
<Story name="Expanded" args={{ isCollapsed: false }}>
	{#snippet template(args: ProfileCardProps)}
		<div class="w-64 rounded-lg border border-border bg-background">
			<ProfileCard {...args} />
		</div>
	{/snippet}
</Story>

<!-- Collapsed (icon-only sidebar state) -->
<Story name="Collapsed" args={{ isCollapsed: true }}>
	{#snippet template(args: ProfileCardProps)}
		<div class="w-14 rounded-lg border border-border bg-background">
			<ProfileCard {...args} />
		</div>
	{/snippet}
</Story>

<!-- Custom user -->
<Story
	name="Custom User"
	args={{
		userName: 'Priya Sharma',
		userRole: 'Finance Manager',
		userInitials: 'PS',
		vanNumber: 'VAN-2024-00456',
		isCollapsed: false
	}}
>
	{#snippet template(args: ProfileCardProps)}
		<div class="w-64 rounded-lg border border-border bg-background">
			<ProfileCard {...args} />
		</div>
	{/snippet}
</Story>
