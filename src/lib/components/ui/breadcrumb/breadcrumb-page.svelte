<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	data-slot="breadcrumb-page"
	role="link"
	aria-disabled="true"
	aria-current="page"
	class={cn(
		'inline-flex items-center text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
