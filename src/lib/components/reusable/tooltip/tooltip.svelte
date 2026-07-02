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
		<UITooltip.TooltipTrigger class={cn('cursor-default', className)}>
			{#if IconComponent}
				<IconComponent class="size-4 text-muted-foreground" />
			{:else if children}
				{@render children()}
			{/if}
		</UITooltip.TooltipTrigger>
		<UITooltip.TooltipContent {side}>
			{content}
		</UITooltip.TooltipContent>
	</UITooltip.Tooltip>
</UITooltip.TooltipProvider>
