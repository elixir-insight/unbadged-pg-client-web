<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { organizations } from '$lib/data/mockData';
	import { ConfigurationTab } from '../../../components/index';
	import { getOrganizationOrgContext } from '../../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();

	const orgId = $derived(page.params.orgId ?? '');
	const org = $derived(organizations.find((o) => o.id === orgId));

	async function handleConfirmActivate() {
		await orgState.confirmActivate();
		toast.success('Organization activated successfully');
	}
</script>

{#if org}
	<ConfigurationTab
		orgId={org.id}
		orgName={org.name}
		orgStatus={orgState.effectiveStatus}
		onactivate={handleConfirmActivate}
	/>
{/if}
