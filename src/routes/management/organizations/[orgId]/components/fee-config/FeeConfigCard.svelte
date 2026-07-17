<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children,
		footer
	}: {
		title: string;
		subtitle: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
	<div class="border-b border-border px-5 py-4">
		<h2 class="text-sm font-semibold text-card-foreground">{title}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
	</div>
	<div class="p-5">
		{@render children()}
	</div>
	{#if footer}
		<div class="border-t border-border px-5 py-4">
			{@render footer()}
		</div>
	{/if}
</section>
