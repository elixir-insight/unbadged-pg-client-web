<script lang="ts">
	import { Checkbox as UICheckbox } from '$lib/components/ui/checkbox';
	import { cn } from '$lib/utils';

	interface Props {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		label?: string;
		description?: string;
		id?: string;
		class?: string;
	}

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		disabled = false,
		label,
		description,
		id,
		class: className
	}: Props = $props();

	const generatedId = $props.id();
	const checkboxId = $derived(id ?? generatedId);
</script>

{#if label || description}
	<div class={cn('flex items-start gap-3', className)}>
		<UICheckbox bind:checked bind:indeterminate {disabled} id={checkboxId} class="mt-0.5" />
		<div class="flex flex-col gap-0.5">
			{#if label}
				<label
					for={checkboxId}
					class={cn(
						'cursor-pointer text-sm font-medium leading-none',
						disabled && 'cursor-not-allowed opacity-50'
					)}
				>
					{label}
				</label>
			{/if}
			{#if description}
				<p class="text-muted-foreground text-sm">{description}</p>
			{/if}
		</div>
	</div>
{:else}
	<UICheckbox bind:checked bind:indeterminate {disabled} id={checkboxId} class={className} />
{/if}
