<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type CardTint = 'primary' | 'info' | 'success';

	export interface CardProps {
		title?: string;
		description?: string;
		size?: 'default' | 'sm';
		tint?: CardTint;
		class?: string;
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
		action?: Snippet;
	}
</script>

<script lang="ts">
	import * as CardUI from '$lib/components/ui/card';
	import { cn } from '$lib/utils';

	const tints: Record<string, string> = {
		primary: 'from-primary/10 via-primary/5 to-transparent text-primary',
		info: 'from-info/10 via-info/5 to-transparent text-info',
		success: 'from-success/10 via-success/5 to-transparent text-success'
	};

	let {
		title,
		description,
		size = 'default',
		tint,
		class: className,
		children,
		header,
		footer,
		action
	}: CardProps = $props();

	const hasHeader = $derived(!!(title || description || header || action));
	const tintClass = $derived(tint ? `bg-linear-to-br ${tints[tint]}` : '');
</script>

<CardUI.Root {size} class={cn(tintClass, className)}>
	{#if hasHeader}
		<CardUI.Header>
			{#if header}
				{@render header()}
			{:else}
				{#if title}
					<CardUI.Title>{title}</CardUI.Title>
				{/if}
				{#if description}
					<CardUI.Description>{description}</CardUI.Description>
				{/if}
			{/if}
			{#if action}
				<CardUI.Action>
					{@render action()}
				</CardUI.Action>
			{/if}
		</CardUI.Header>
	{/if}

	{#if children}
		<CardUI.Content>
			{@render children()}
		</CardUI.Content>
	{/if}

	{#if footer}
		<CardUI.Footer>
			{@render footer()}
		</CardUI.Footer>
	{/if}
</CardUI.Root>
