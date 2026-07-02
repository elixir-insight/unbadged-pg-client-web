<script lang="ts">
	import { AppShell } from '$lib/components/reusable';

	let { children } = $props();
</script>

<AppShell app="partner">
	{@render children()}
</AppShell>
