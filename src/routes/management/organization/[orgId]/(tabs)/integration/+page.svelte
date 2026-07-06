<script lang="ts">
	import { ApplicationIntegrationTab } from '../../components/index';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();
</script>

<ApplicationIntegrationTab bind:integration={orgState.integration} />
