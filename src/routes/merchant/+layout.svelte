<script lang="ts">
	import AppShell from '$lib/components/reusable/app-shell/app-shell.svelte';
	let { children } = $props();
</script>

<AppShell app="merchant">
	{@render children()}
</AppShell>
