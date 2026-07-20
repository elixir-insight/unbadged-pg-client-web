<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet, Component } from 'svelte';

	let {
		icon: IconComponent,
		title,
		description,
		action,
		class: className
	}: {
		icon?: Component;
		title: string;
		description?: string;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center',
		className
	)}
>
	{#if IconComponent}
		<div
			class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
		>
			<IconComponent class="size-6" />
		</div>
	{/if}
	<div>
		<h3 class="text-sm font-semibold text-foreground">{title}</h3>
		{#if description}
			<p class="mt-1 text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if action}
		{@render action()}
	{/if}
</div>
