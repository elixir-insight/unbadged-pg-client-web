<script lang="ts">
	import Card from './card.svelte';
	import { fly } from 'svelte/transition';
	import type { Component, Snippet } from 'svelte';

	interface Props {
		icon: Component;
		title: string;
		description?: string;
		trailing?: Snippet;
		footer?: Snippet;
		class?: string;
		children: Snippet;
	}

	let {
		icon: Icon,
		title,
		description,
		trailing,
		footer: footerContent,
		class: className,
		children
	}: Props = $props();
</script>

<div in:fly={{ y: 10, duration: 220 }}>
	<Card class="overflow-hidden bg-background {className ?? ''}" footer={footerContent}>
		{#snippet header()}
			<div class="flex items-center justify-between gap-3">
				<div class="flex min-w-0 items-center gap-3">
					<div
						class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Icon class="size-4.5" />
					</div>
					<div class="min-w-0">
						<p class="text-base leading-none font-semibold">{title}</p>
						{#if description}
							<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
						{/if}
					</div>
				</div>
				{#if trailing}
					{@render trailing()}
				{/if}
			</div>
		{/snippet}

		<div class="-mx-6 -my-4 divide-y divide-border/30">
			{@render children()}
		</div>
	</Card>
</div>
