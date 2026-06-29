<script lang="ts">
	import { Input as UIInput } from '$lib/components/ui/input';
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type = 'text' as InputType,
		placeholder,
		disabled = false,
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLInputAttributes, 'type' | 'files'>> & { type?: InputType } = $props();
</script>

<UIInput bind:ref bind:value {type} {placeholder} {disabled} class={cn(className)} {...restProps} />
