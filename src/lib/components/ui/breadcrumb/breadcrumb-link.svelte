<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		href = undefined,
		child,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		child?: Snippet<[{ props: HTMLAnchorAttributes }]>;
	} = $props();

	const attrs = $derived({
		'data-slot': 'breadcrumb-link',
		class: cn(
			'inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold text-foreground hover:underline underline-offset-4 decoration-primary/40 hover:text-primary hover:decoration-primary/70 disabled:pointer-events-none disabled:opacity-50',
			className
		),
		href,
		...restProps
	});
</script>

{#if child}
	{@render child({ props: attrs })}
{:else}
	<a bind:this={ref} {...attrs}>
		{@render children?.()}
	</a>
{/if}
