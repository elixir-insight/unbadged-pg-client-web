<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		direction?: 'bottom' | 'top' | 'left' | 'right';
		trigger?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		direction = 'bottom',
		trigger,
		children,
		footer
	}: Props = $props();
</script>

<Drawer.Root bind:open {direction}>
	{#if trigger}
		<Drawer.Trigger>
			{@render trigger()}
		</Drawer.Trigger>
	{/if}
	<Drawer.Content>
		{#if title || description}
			<Drawer.Header>
				{#if title}
					<Drawer.Title>{title}</Drawer.Title>
				{/if}
				{#if description}
					<Drawer.Description>{description}</Drawer.Description>
				{/if}
			</Drawer.Header>
		{/if}
		{#if children}
			<div class="overflow-auto px-4 pb-2">
				{@render children()}
			</div>
		{/if}
		{#if footer}
			<Drawer.Footer>
				{@render footer()}
			</Drawer.Footer>
		{/if}
	</Drawer.Content>
</Drawer.Root>
