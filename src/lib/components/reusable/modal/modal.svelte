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
		<Dialog.Header class="shrink-0">
			<Dialog.Title>{title}</Dialog.Title>
			{#if description}
				<Dialog.Description>{description}</Dialog.Description>
			{/if}
		</Dialog.Header>
		{#if children}
			<div class="min-h-0 overflow-y-auto pe-1">
				{@render children()}
			</div>
		{/if}
		{#if footer}
			<Dialog.Footer class="-mx-6 -mb-6 shrink-0 border-t border-border px-6 py-4">
				{@render footer()}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
