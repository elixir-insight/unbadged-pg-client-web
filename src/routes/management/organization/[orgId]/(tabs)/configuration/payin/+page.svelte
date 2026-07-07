<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { organizations } from '$lib/data/mockData';
	import { ConfigurationTab } from '$lib/components/organization';
	import { getOrganizationOrgContext } from '../../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();

	const orgId = $derived(page.params.orgId ?? '');
	const org = $derived(organizations.find((o) => o.id === orgId));

	async function handleConfirmActivate() {
		await orgState.confirmActivateService(orgId, 'payin');
		toast.success('Payin profile activated successfully');
	}
</script>

{#if org}
	<ConfigurationTab
		orgId={org.id}
		orgName={org.name}
		serviceType="payin"
		onactivate={handleConfirmActivate}
	/>
{/if}
