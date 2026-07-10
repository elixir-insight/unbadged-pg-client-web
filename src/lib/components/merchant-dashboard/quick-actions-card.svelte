<script module lang="ts">
	import type { Component } from 'svelte';

	export interface QuickAction {
		label: string;
		icon: Component;
		onClick?: () => void;
	}
</script>

<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		actions: QuickAction[];
		class?: string;
	}

	let { actions, class: className }: Props = $props();
</script>

<div
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<p class="text-sm font-semibold">Quick actions</p>

	<div class="mt-3 grid flex-1 grid-cols-2 gap-3">
		{#each actions as action (action.label)}
			<Button
				variant="outline"
				onclick={action.onClick}
				class="h-full flex-col items-center justify-center gap-2.5 px-2"
			>
				<span class="flex size-10 items-center justify-center rounded-lg bg-muted">
					<action.icon class="size-5" />
				</span>
				<span class="text-sm font-medium">{action.label}</span>
			</Button>
		{/each}
	</div>
</div>
