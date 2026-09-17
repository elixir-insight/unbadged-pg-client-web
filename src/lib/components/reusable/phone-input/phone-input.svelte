<script lang="ts">
	import Input from '../input/input.svelte';
	import { cn } from '$lib/utils';
	import { normalizeIndianMobilePhone } from '$lib/validation/organization-kyb';
	import type { HTMLInputAttributes, EventHandler } from 'svelte/elements';

	let {
		id,
		name,
		value = $bindable(''),
		disabled = false,
		invalid = false,
		placeholder = '',
		class: className,
		oninput,
		onValueChange,
		...restProps
	}: Omit<HTMLInputAttributes, 'type' | 'value'> & {
		value?: string;
		invalid?: boolean;
		onValueChange?: (value: string) => void;
		oninput?: EventHandler<Event, HTMLInputElement>;
	} = $props();

	const displayValue = $derived(normalizeIndianMobilePhone(value));

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		const next = normalizeIndianMobilePhone(event.currentTarget.value).slice(0, 10);
		value = next;
		onValueChange?.(next);
		oninput?.(event);
	}
</script>

<div
	class={cn(
		'flex h-9 overflow-hidden rounded-md border border-input bg-background shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
		invalid && 'border-destructive focus-within:ring-destructive/30',
		className
	)}
>
	<span
		class="flex items-center border-r border-border bg-muted/40 px-3 text-sm text-muted-foreground"
	>
		+91
	</span>
	<Input
		{id}
		{name}
		type="tel"
		inputmode="numeric"
		{placeholder}
		{disabled}
		value={displayValue}
		oninput={handleInput}
		class="border-0 shadow-none focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
		{...restProps}
	/>
</div>
