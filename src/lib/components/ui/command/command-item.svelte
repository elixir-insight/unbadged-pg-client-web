<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { Check } from '$lib/assets/icons';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		"relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<Check
		class="ml-auto size-4 opacity-0 group-data-[checked=true]/command-item:opacity-100 data-[selected=true]:opacity-100"
	/>
</CommandPrimitive.Item>
