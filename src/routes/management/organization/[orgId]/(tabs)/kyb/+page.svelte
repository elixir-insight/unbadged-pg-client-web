<script lang="ts">
	import { KybTab } from '../../components/index';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();
</script>

<KybTab kyb={orgState.detail.kyb} />
