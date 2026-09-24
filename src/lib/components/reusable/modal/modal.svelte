<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		class?: string;
		trigger?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		contentClass?: string;
	}

	let {
		open = $bindable(false),
		title,
		description,
		class: className,
		trigger,
		children,
		footer,
		contentClass
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	{#if trigger}
		<Dialog.Trigger>
			{@render trigger()}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content
		class={cn(
			'flex max-h-[min(90vh,calc(100dvh-2rem))] flex-col overflow-hidden',
			className,
			contentClass
		)}
	>
		<Dialog.Header class="shrink-0 space-y-1.5 pr-8">
			<Dialog.Title class="text-lg font-semibold tracking-tight text-foreground">
				{title}
			</Dialog.Title>
			{#if description}
				<Dialog.Description>{description}</Dialog.Description>
			{/if}
		</Dialog.Header>
		{#if children}
			<div class="min-h-0 overflow-y-auto p-1">
				{@render children()}
			</div>
		{/if}
		{#if footer}
			<Dialog.Footer class="-mx-6 shrink-0 border-t border-border px-6 pt-4 pb-1">
				{@render footer()}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
