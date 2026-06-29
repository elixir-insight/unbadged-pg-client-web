<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly, scale } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Button } from '$lib/components/reusable';
	import { ArrowRightIcon, CheckIcon } from '$lib/assets/icons';

	type ClientType = 'Merchant' | 'Partner';

	interface Category {
		value: ClientType;
		icon: import('svelte').Component;
		title: string;
		description: string;
		features: string[];
		activeBorder: string;
		activeIconBg: string;
		activeBg: string;
		checkBg: string;
		activeGlow: string;
	}

	interface Props {
		categories: Category[];
		selectedCategory: ClientType | null;
		canContinue: boolean;
		onNext: () => void;
	}

	let { categories, selectedCategory = $bindable(), canContinue, onNext }: Props = $props();
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
		<span
			class="mb-5 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-[11px] font-semibold tracking-widest text-primary uppercase"
		>
			Step 1 of 2
		</span>

		<h1 class="text-center text-3xl font-bold tracking-tight">Select client category</h1>
		<p class="mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
			Choose the type that best describes this organization's role in the payment ecosystem.
		</p>

		<div class="mt-10 grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
			{#each categories as cat (cat.value)}
				{@const isSelected = selectedCategory === cat.value}
				{@const CatIcon = cat.icon}
				<button
					onclick={() => (selectedCategory = cat.value)}
					class={cn(
						'group relative flex flex-col items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left shadow-sm transition-all duration-300',
						'hover:-translate-y-1 hover:shadow-md',
						isSelected
							? [cat.activeBorder, cat.activeBg, 'shadow-md']
							: 'border-border/50 hover:border-border'
					)}
				>
					{#if isSelected}
						<span
							class={cn(
								'absolute top-3 right-3 flex size-5 items-center justify-center rounded-full text-white',
								cat.checkBg
							)}
							in:scale={{ duration: 200, easing: backOut, start: 0.3 }}
						>
							<CheckIcon class="size-3" />
						</span>
					{/if}

					<div
						class={cn(
							'flex size-10 items-center justify-center rounded-xl transition-colors duration-200',
							isSelected
								? cat.activeIconBg
								: 'bg-muted/60 text-muted-foreground group-hover:bg-muted'
						)}
					>
						<CatIcon class="size-5" />
					</div>

					<div>
						<p class="text-base font-bold tracking-tight">{cat.title}</p>
						<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
							{cat.description}
						</p>
					</div>

					<hr class="w-full border-t border-border/50" />

					<ul class="w-full space-y-2">
						{#each cat.features as feat (feat)}
							<li class="flex items-center gap-2 text-xs">
								<span
									class={cn(
										'flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
										isSelected ? [cat.checkBg, 'text-white'] : 'bg-border text-muted-foreground'
									)}
								>
									<CheckIcon class="size-2" />
								</span>
								<span class={isSelected ? 'text-foreground' : 'text-muted-foreground'}>
									{feat}
								</span>
							</li>
						{/each}
					</ul>
				</button>
			{/each}
		</div>

		<div class="mt-8 flex items-center justify-center">
			<Button
				disabled={!canContinue}
				size="lg"
				onclick={onNext}
				class="gradient-primary gap-2 rounded-full px-6 text-primary-foreground disabled:opacity-40"
			>
				Continue
				<ArrowRightIcon class="size-4" />
			</Button>
		</div>
	</div>
</div>
