<script lang="ts">
	import { ApplicationIntegrationTab } from '$lib/components/organization';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();
</script>

<ApplicationIntegrationTab bind:integration={orgState.integration} />
