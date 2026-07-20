<script module lang="ts">
	import type { ComponentProps } from 'svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProfileCard from './profile-card.svelte';

	type ProfileCardProps = ComponentProps<typeof ProfileCard>;

	const defaultArgs = {
		userName: 'Aarav Kapoor',
		userRole: 'Admin',
		userInitials: 'AK',
		vanNumber: 'VAN-2024-00123',
		isCollapsed: false
	} satisfies ProfileCardProps;

	function toProfileProps(args: object): ProfileCardProps {
		const record = args as Record<string, unknown>;
		return {
			userName: String(record.userName ?? ''),
			userRole: String(record.userRole ?? ''),
			userInitials: String(record.userInitials ?? ''),
			vanNumber: record.vanNumber != null ? String(record.vanNumber) : undefined,
			isCollapsed: Boolean(record.isCollapsed),
			settingsHref: record.settingsHref != null ? String(record.settingsHref) : undefined
		};
	}

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
		args: defaultArgs
	});
</script>

<!-- Expanded (default sidebar state) -->
<Story name="Expanded" args={{ ...defaultArgs, isCollapsed: false }}>
	{#snippet template(args)}
		{@const props = toProfileProps(args)}
		<div class="w-64 rounded-lg border border-border bg-background">
			<ProfileCard {...props} />
		</div>
	{/snippet}
</Story>

<!-- Collapsed (icon-only sidebar state) -->
<Story name="Collapsed" args={{ ...defaultArgs, isCollapsed: true }}>
	{#snippet template(args)}
		{@const props = toProfileProps(args)}
		<div class="w-14 rounded-lg border border-border bg-background">
			<ProfileCard {...props} />
		</div>
	{/snippet}
</Story>

<!-- Custom user -->
<Story
	name="Custom User"
	args={{
		...defaultArgs,
		userName: 'Priya Sharma',
		userRole: 'Finance Manager',
		userInitials: 'PS',
		vanNumber: 'VAN-2024-00456',
		isCollapsed: false
	}}
>
	{#snippet template(args)}
		{@const props = toProfileProps(args)}
		<div class="w-64 rounded-lg border border-border bg-background">
			<ProfileCard {...props} />
		</div>
	{/snippet}
</Story>
