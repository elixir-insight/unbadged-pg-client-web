<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		amount: string;
		createdAt: string;
		subtitle?: string;
		statusBadge: Snippet;
	}

	let { amount, createdAt, subtitle, statusBadge }: Props = $props();
</script>

<div class="min-w-0">
	<p class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{amount}</p>
	<div class="mt-2 flex flex-wrap items-center gap-2">
		{@render statusBadge()}
	</div>
	{#if subtitle}
		<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
	{/if}
	<p class="mt-2 text-sm text-muted-foreground">Created on: {createdAt}</p>
</div>
