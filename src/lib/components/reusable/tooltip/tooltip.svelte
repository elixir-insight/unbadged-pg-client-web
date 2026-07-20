<script lang="ts">
	import * as UITooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import type { Snippet, Component } from 'svelte';

	let {
		content,
		side = 'top' as 'top' | 'right' | 'bottom' | 'left',
		delayDuration = 0,
		icon: IconComponent,
		class: className,
		children
	}: {
		content: string;
		side?: 'top' | 'right' | 'bottom' | 'left';
		delayDuration?: number;
		icon?: Component;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<UITooltip.TooltipProvider {delayDuration}>
	<UITooltip.Tooltip>
		{#if IconComponent}
			<UITooltip.TooltipTrigger class={cn('cursor-default', className)}>
				<IconComponent class="size-4 text-muted-foreground" />
			</UITooltip.TooltipTrigger>
		{:else if children}
			<!-- Render as a span so wrapping a disabled <button> stays valid HTML and stays hoverable. -->
			<UITooltip.TooltipTrigger>
				{#snippet child({ props })}
					<span {...props} class={cn('inline-flex', className)}>
						{@render children()}
					</span>
				{/snippet}
			</UITooltip.TooltipTrigger>
		{/if}
		<UITooltip.TooltipContent {side}>
			{content}
		</UITooltip.TooltipContent>
	</UITooltip.Tooltip>
</UITooltip.TooltipProvider>
