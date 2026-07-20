<script lang="ts">
	import { CopyButton } from '$lib/components/reusable';

	let { utr }: { utr: string | null } = $props();
</script>

{#if utr}
	<div class="flex items-center gap-1.5">
		<span class="font-mono text-xs">{utr}</span>
		<CopyButton value={utr} label="Copy UTR" stopPropagation />
	</div>
{:else}
	<span class="text-muted-foreground">—</span>
{/if}
