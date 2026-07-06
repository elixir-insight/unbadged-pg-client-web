<script lang="ts">
	import IntegrationPanel from '$lib/components/organization/integration-panel.svelte';
	import type { IntegrationDetail } from './types';

	interface Props {
		integration: IntegrationDetail;
	}

	let { integration = $bindable() }: Props = $props();
</script>

<IntegrationPanel bind:integration />
