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
		settingsHref: '/merchant/settings',
		isCollapsed: false
	} satisfies ProfileCardProps;

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

<!-- No custom templates: avoids Storybook args union vs ComponentProps type errors in svelte-check -->
<Story name="Expanded" args={{ ...defaultArgs, isCollapsed: false }} />
<Story name="Collapsed" args={{ ...defaultArgs, isCollapsed: true }} />
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
/>
