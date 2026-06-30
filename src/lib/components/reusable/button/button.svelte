<script lang="ts">
	import { Button as UIButton, type ButtonProps } from '$lib/components/ui/button';

	let {
		variant = 'default',
		size = 'default',
		disabled = false,
		href = undefined,
		class: className,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<UIButton {variant} {size} {disabled} {href} class={className} {...restProps}>
	{@render children?.()}
</UIButton>
