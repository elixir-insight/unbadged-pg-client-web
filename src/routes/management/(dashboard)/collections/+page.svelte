<script lang="ts">
	import { CollectionsTab } from '$lib/components/management/dashboard';
	import { AccessRestricted } from '$lib/components/reusable';
	import { userPermissions } from '$lib/stores/rbac';
</script>

{#if userPermissions.can('PAYINS', 'read')}
	<CollectionsTab />
{:else}
	<AccessRestricted
		title="Collections access restricted"
		description="You don't have permission to view Payins data for this organization."
		moduleLabel="Payins"
	/>
{/if}
