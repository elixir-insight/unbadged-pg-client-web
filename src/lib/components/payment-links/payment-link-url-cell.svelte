<script lang="ts">
	import { CopyButton } from '$lib/components/reusable';

	let { url }: { url: string } = $props();
</script>

<div class="flex max-w-[200px] items-center gap-1.5">
	<span class="truncate font-mono text-xs">{url}</span>
	<CopyButton value={url} label="Copy payment link" stopPropagation />
</div>
