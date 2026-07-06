<script lang="ts">
	import { OrganizationOrgState, setOrganizationOrgContext } from './organization-org.svelte';

	let { children } = $props();

	const orgState = new OrganizationOrgState();
	setOrganizationOrgContext(orgState);
</script>

{@render children()}
