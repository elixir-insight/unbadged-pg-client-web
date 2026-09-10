<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		title,
		action,
		bordered = true,
		children
	}: {
		title?: string;
		action?: Snippet;
		bordered?: boolean;
		children: Snippet;
	} = $props();
</script>

<section class={cn('h-full p-5', bordered && 'rounded-xl border border-border')}>
	{#if title || action}
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
			{#if title}
				<p
					class="inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold tracking-wide text-primary uppercase"
				>
					{title}
				</p>
			{:else}
				<span></span>
			{/if}
			{#if action}
				<div class="shrink-0">{@render action()}</div>
			{/if}
		</div>
	{/if}
	{@render children()}
</section>
