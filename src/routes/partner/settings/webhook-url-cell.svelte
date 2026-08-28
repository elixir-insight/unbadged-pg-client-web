<script lang="ts">
	import { Tooltip } from '$lib/components/reusable';

	let { url }: { url: string } = $props();
</script>

<Tooltip content={url} side="top">
	<span class="block max-w-56 truncate font-mono text-xs text-foreground">{url}</span>
</Tooltip>
