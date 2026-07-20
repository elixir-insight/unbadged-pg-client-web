<script lang="ts">
	import type { Component } from 'svelte';
	import { Button } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	let {
		icon: IconComponent,
		title,
		description,
		actionLabel,
		onaction,
		class: className
	}: {
		icon?: Component;
		title: string;
		description?: string;
		actionLabel?: string;
		onaction?: () => void;
		class?: string;
	} = $props();
</script>

<div
	class={cn('flex flex-col items-center justify-center gap-3 px-4 py-16 text-center', className)}
>
	{#if IconComponent}
		<div
			class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10"
		>
			<IconComponent class="size-5 text-muted-foreground/40" />
		</div>
	{/if}
	<div class="flex flex-col gap-1">
		<p class="text-sm font-medium text-foreground">{title}</p>
		{#if description}
			<p class="text-xs text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if actionLabel && onaction}
		<Button variant="outline" size="sm" onclick={onaction}>
			{actionLabel}
		</Button>
	{/if}
</div>
