<script lang="ts">
	import { Textarea as UITextarea } from '$lib/components/ui/textarea';
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder,
		disabled = false,
		rows,
		label,
		required = false,
		id,
		containerClass,
		class: className,
		...restProps
	}: WithElementRef<HTMLTextareaAttributes> & {
		label?: string;
		required?: boolean;
		containerClass?: string;
	} = $props();

	const generatedId = $props.id();
	const textareaId = $derived(id ?? generatedId);
</script>

{#if label}
	<div class={cn('space-y-1.5', containerClass)}>
		<label for={textareaId} class="text-sm font-medium text-foreground">
			{label}
			{#if required}
				<span class="text-destructive">*</span>
			{/if}
		</label>
		<UITextarea
			bind:ref
			bind:value
			id={textareaId}
			{placeholder}
			{disabled}
			{rows}
			class={cn(className)}
			{...restProps}
		/>
	</div>
{:else}
	<UITextarea
		bind:ref
		bind:value
		id={textareaId}
		{placeholder}
		{disabled}
		{rows}
		class={cn(className)}
		{...restProps}
	/>
{/if}
