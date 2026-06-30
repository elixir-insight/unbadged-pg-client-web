<script lang="ts">
	import { Chip as UIChip, type BadgeVariant } from '$lib/components/ui/badge';
	import { type WithElementRef } from '$lib/utils';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		variant = 'default' as BadgeVariant,
		href,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & { variant?: BadgeVariant } = $props();
</script>

<UIChip bind:ref {variant} {href} class={className} {...restProps}>
	{@render children?.()}
</UIChip>
