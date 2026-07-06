<script lang="ts">
	import { KybTab } from '$lib/components/organization';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();
</script>

<KybTab kyb={orgState.detail.kyb} />
