<script lang="ts">
	import Dropdown from '$lib/components/reusable/dropdown/dropdown.svelte';
	import type { DropdownOption } from '$lib/components/reusable/dropdown/dropdown.svelte';
	import { cn } from '$lib/utils';

	let {
		label,
		value = $bindable(''),
		options = [] as DropdownOption[],
		placeholder = 'Select an option',
		disabled = false,
		class: className,
		onValueChange
	}: {
		label: string;
		value?: string;
		options?: DropdownOption[];
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onValueChange?: (value: string) => void;
	} = $props();
</script>

<div class={cn('flex flex-col gap-2', className)}>
	<span class="text-sm font-medium text-foreground">{label}</span>
	<Dropdown
		bind:value
		{options}
		{placeholder}
		{disabled}
		bordered
		onValueChange={(next) => onValueChange?.(next)}
	/>
</div>
