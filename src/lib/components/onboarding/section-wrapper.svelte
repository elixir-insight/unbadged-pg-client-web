<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		title: string;
		description?: string;
		icon?: import('svelte').Component;
		delay?: number;
		class?: string;
		children: import('svelte').Snippet;
		actions?: import('svelte').Snippet;
	}

	let {
		title,
		description,
		icon: Icon,
		delay = 0,
		class: className,
		children,
		actions
	}: Props = $props();
</script>

<div
	class={cn('surface-card overflow-hidden', className)}
	in:fly={{ y: 10, duration: 260, delay, easing: cubicOut }}
>
	{#if Icon || title}
		<div class="flex items-start justify-between gap-4 border-b border-border/50 px-6 py-4">
			<div class="flex items-center gap-3">
				{#if Icon}
					<div
						class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<Icon class="size-4" />
					</div>
				{/if}
				<div>
					<p class="text-sm font-semibold">{title}</p>
					{#if description}
						<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
					{/if}
				</div>
			</div>
			{#if actions}
				<div class="shrink-0">
					{@render actions()}
				</div>
			{/if}
		</div>
	{/if}
	<div class="p-6">
		{@render children()}
	</div>
</div>
