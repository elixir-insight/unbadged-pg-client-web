<script lang="ts">
	import { ProfileCard } from '$lib/components/reusable';
	import { formatUserType, getUserInitials } from '$lib/stores/auth/display';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { cn } from '$lib/utils';

	let {
		displayName = '',
		isCollapsed = false,
		class: className
	}: {
		displayName?: string;
		isCollapsed?: boolean;
		class?: string;
	} = $props();

	const session = $derived(merchantSession.session);
	const profileName = $derived(session?.merchantName || displayName || 'User');
</script>

{#if session}
	<div class={cn(className)}>
		<ProfileCard
			userName={profileName}
			userRole={formatUserType(session.userType ?? '')}
			userInitials={getUserInitials(profileName)}
			vanNumber={session.displayOrgId}
			{isCollapsed}
			confirmLogout
		/>
	</div>
{/if}
