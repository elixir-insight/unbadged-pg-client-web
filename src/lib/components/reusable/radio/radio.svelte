<script module lang="ts">
	export type RadioOption = {
		value: string;
		label: string;
		description?: string;
		disabled?: boolean;
	};
</script>

<script lang="ts">
	import * as RadioGroupUI from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';

	interface Props {
		value?: string;
		options: RadioOption[];
		orientation?: 'horizontal' | 'vertical';
		disabled?: boolean;
		class?: string;
	}

	let {
		value = $bindable(''),
		options,
		orientation = 'vertical',
		disabled = false,
		class: className
	}: Props = $props();
</script>

<RadioGroupUI.Root
	bind:value
	class={cn(
		orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-4' : 'flex flex-col gap-3',
		className
	)}
>
	{#each options as option (option.value)}
		{@const isDisabled = disabled || option.disabled}
		<div class="flex items-start gap-3">
			<RadioGroupUI.Item
				value={option.value}
				id={`radio-${option.value}`}
				disabled={isDisabled}
				class="mt-0.5"
			/>
			<div class="flex flex-col gap-0.5">
				<label
					for={`radio-${option.value}`}
					class={cn(
						'cursor-pointer text-sm leading-none font-medium',
						isDisabled && 'cursor-not-allowed opacity-50'
					)}
				>
					{option.label}
				</label>
				{#if option.description}
					<p class="text-sm text-muted-foreground">{option.description}</p>
				{/if}
			</div>
		</div>
	{/each}
</RadioGroupUI.Root>
