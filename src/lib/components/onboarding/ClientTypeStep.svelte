<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils';

	type ClientType = 'Merchant' | 'Partner';

	const clientTypes: {
		value: ClientType;
		title: string;
		description: string;
		image: string;
	}[] = [
		{
			value: 'Merchant',
			title: 'Merchant',
			description: 'Sell your products or services and accept payments through our platform.',
			image: '/images/MerchantCategory.png'
		},
		{
			value: 'Partner',
			title: 'Partner',
			description: 'Refer clients, integrate our solutions, or grow your business alongside us.',
			image: '/images/handShaking.png'
		}
	];

	interface Props {
		selectedCategory: ClientType | null;
		onNext: () => void;
	}

	let { selectedCategory = $bindable(), onNext }: Props = $props();

	function selectAndContinue(value: ClientType) {
		selectedCategory = value;
		onNext();
	}
</script>

<div
	class="relative flex flex-col items-center justify-center px-4 py-12"
	in:fly={{ y: 16, duration: 280, easing: cubicOut }}
>
	<div
		class="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
		style="background-image: radial-gradient(circle, var(--border) 1px, transparent 1px); background-size: 24px 24px;"
		aria-hidden="true"
	></div>

	<div class="relative flex flex-col items-center">
		<h2 class="text-center font-bold tracking-tight">What category would you like to choose?</h2>

		<div class="mt-10 grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
			{#each clientTypes as type (type.value)}
				{@const isSelected = selectedCategory === type.value}
				<button
					type="button"
					aria-pressed={isSelected}
					onclick={() => selectAndContinue(type.value)}
					class={cn(
						'flex cursor-pointer flex-col items-center rounded-2xl border-2 bg-background p-6 text-center shadow-xs transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
						isSelected
							? 'border-primary bg-primary/10 ring-1 ring-primary/20'
							: 'border-border hover:border-primary/40 hover:bg-accent hover:shadow-sm'
					)}
				>
					<div class={cn('flex size-50 items-center justify-center rounded-xl')}>
						<img src={type.image} alt={type.title} class="size-50 object-contain" />
					</div>

					<h3 class={cn('mt-4 font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
						{type.title}
					</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						{type.description}
					</p>
				</button>
			{/each}
		</div>
	</div>
</div>
