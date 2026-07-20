<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { AlertCircle, RefreshCw } from '$lib/assets/icons';
	import type { Component } from 'svelte';

	let {
		icon,
		title,
		description,
		actionLabel,
		onAction
	}: {
		icon?: Component;
		title: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
	} = $props();

	const IconComponent = $derived(icon ?? AlertCircle);
</script>

<div
	class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background p-16 text-center shadow-sm"
>
	<div
		class="mb-1 flex size-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10"
	>
		<IconComponent class="size-5 text-muted-foreground/60" />
	</div>
	<p class="text-sm font-medium text-foreground">{title}</p>
	{#if description}
		<p class="max-w-sm text-xs text-muted-foreground">{description}</p>
	{/if}
	{#if actionLabel && onAction}
		<Button variant="outline" size="sm" class="mt-2" onclick={onAction}>
			<RefreshCw class="size-3.5" />
			{actionLabel}
		</Button>
	{/if}
</div>
