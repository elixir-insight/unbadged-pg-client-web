<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		orientation?: 'horizontal' | 'vertical';
	};

	let { class: className, orientation = 'horizontal', children, ...restProps }: Props = $props();
</script>

<div
	role="group"
	data-slot="button-group"
	data-orientation={orientation}
	class={cn(
		'flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10',
		orientation === 'horizontal' &&
			'[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none',
		orientation === 'vertical' &&
			'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
