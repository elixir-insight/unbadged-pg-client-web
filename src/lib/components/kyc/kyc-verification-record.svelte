<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		refId,
		children
	}: {
		refId: string;
		children: Snippet;
	} = $props();
</script>

<div class="relative flex flex-col rounded-xl border border-border bg-card p-6">
	<div class="mb-3 flex items-start justify-between gap-4">
		<p class="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
			Verification record
		</p>
		<p class="shrink-0 font-mono text-[11px] text-muted-foreground/60">{refId}</p>
	</div>
	{@render children()}
</div>
