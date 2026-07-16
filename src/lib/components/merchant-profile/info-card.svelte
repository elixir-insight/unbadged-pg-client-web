<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet, Component } from 'svelte';

	let {
		title,
		description,
		icon: Icon,
		class: className,
		contentClass = 'p-6',
		children,
		actions
	}: {
		title: string;
		description?: string;
		icon?: Component;
		class?: string;
		contentClass?: string;
		children: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<div
	class={cn('overflow-hidden rounded-xl border border-border bg-background shadow-sm', className)}
>
	<div class="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
		<div class="flex items-center gap-3">
			{#if Icon}
				<div
					class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<Icon class="size-4.5" />
				</div>
			{/if}
			<div>
				<p class="text-lg font-semibold text-foreground">{title}</p>
				{#if description}
					<p class="mt-0.5 text-sm text-muted-foreground">{description}</p>
				{/if}
			</div>
		</div>
		{#if actions}
			<div class="shrink-0">
				{@render actions()}
			</div>
		{/if}
	</div>
	<div class={contentClass}>
		{@render children()}
	</div>
</div>
