<script module lang="ts">
	export type CardSelectOption = {
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
		options: CardSelectOption[];
		disabled?: boolean;
		class?: string;
		'aria-labelledby'?: string;
		onfocusin?: (event: FocusEvent) => void;
		onfocusout?: (event: FocusEvent) => void;
	}

	let {
		value = $bindable(''),
		options,
		disabled = false,
		class: className,
		'aria-labelledby': ariaLabelledby,
		onfocusin,
		onfocusout
	}: Props = $props();
</script>

<div {onfocusin} {onfocusout}>
	<RadioGroupUI.Root
		bind:value
		aria-labelledby={ariaLabelledby}
		class={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', className)}
	>
		{#each options as option (option.value)}
			{@const selected = value === option.value}
			{@const isDisabled = disabled || option.disabled}
			<label
				class={cn(
					'flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
					'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
					isDisabled && 'cursor-not-allowed opacity-50',
					selected
						? 'border-primary bg-primary/5 ring-1 ring-primary/20'
						: 'border-border bg-card enabled:hover:border-primary/40'
				)}
			>
				<div class="flex min-w-0 flex-col gap-0.5">
					<span class={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>
						{option.label}
					</span>
					{#if option.description}
						<span class="text-xs text-muted-foreground">{option.description}</span>
					{/if}
				</div>
				<RadioGroupUI.Item
					value={option.value}
					disabled={isDisabled}
					aria-label={option.label}
					class="shrink-0"
				/>
			</label>
		{/each}
	</RadioGroupUI.Root>
</div>
