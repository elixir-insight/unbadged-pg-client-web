<script lang="ts">
	import type { Component } from 'svelte';
	import {
		Building2,
		Check,
		CompanyLogoLight,
		FileText,
		IdCardIcon,
		Landmark,
		ShieldCheck,
		Users
	} from '$lib/assets/icons';
	import { Progress } from '$lib/components/ui/progress';
	import { cn } from '$lib/utils';
	import OnboardingProfileCard from './onboarding-profile-card.svelte';
	import {
		firstIncompleteStep,
		flooredProgressPercent,
		STEPS,
		type StepId,
		type StepPath
	} from './steps';

	const stepLabels = STEPS.map((step) => step.title);

	const STEP_ICONS: Record<StepPath, Component> = {
		'business-identity': IdCardIcon,
		'business-profile': Building2,
		'bank-details': Landmark,
		directors: Users,
		documents: FileText,
		'review-submit': ShieldCheck
	};

	let {
		currentStep,
		completedSteps,
		displayName,
		onNavigate
	}: {
		currentStep: StepId;
		completedSteps: readonly number[];
		displayName: string;
		onNavigate: (path: StepPath) => void;
	} = $props();

	const completedCount = $derived(
		STEPS.filter((_, index) => completedSteps.includes(index + 1)).length
	);
	const percent = $derived(
		flooredProgressPercent(Math.round((completedCount / STEPS.length) * 100), currentStep)
	);
	// Steps unlock in order; anything up to the first unfinished step is reachable.
	const furthestStep = $derived(Math.max(firstIncompleteStep(completedSteps), currentStep));
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="flex min-h-0 flex-1 flex-col gap-5 px-5 py-6">
		<CompanyLogoLight class="h-auto w-32" />

		<div class="space-y-2 border-t border-border pt-5">
			<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">Onboarding</p>
			<Progress
				class="h-1.5"
				value={percent}
				max={100}
				aria-label={`Onboarding progress: ${completedCount} of ${STEPS.length} steps, ${percent}%`}
			/>
		</div>

		<nav aria-label="Onboarding steps" class="min-h-0 flex-1 overflow-y-auto">
			<ol class="flex flex-col gap-3">
				{#each STEPS as step, index (step.path)}
					{@const id = (index + 1) as StepId}
					{@const current = id === currentStep}
					{@const completed = !current && completedSteps.includes(id)}
					{@const reachable = id <= furthestStep}
					{@const Icon = STEP_ICONS[step.path]}
					<li class="relative">
						{#if index < STEPS.length - 1}
							<span
								class="absolute top-full left-6 h-3 w-px -translate-x-1/2 bg-border"
								aria-hidden="true"
							></span>
						{/if}
						<button
							type="button"
							disabled={!reachable}
							aria-current={current ? 'step' : undefined}
							class={cn(
								'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
								'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								current && 'bg-primary font-medium text-primary-foreground',
								!current && reachable && 'text-foreground hover:bg-muted',
								!reachable && 'cursor-not-allowed text-muted-foreground opacity-60'
							)}
							onclick={() => {
								if (!current) onNavigate(step.path);
							}}
						>
							<span
								class={cn(
									'flex size-6 shrink-0 items-center justify-center rounded-md',
									current && 'bg-primary-foreground/15',
									completed && 'bg-primary/10 text-primary',
									!current && !completed && 'border border-border'
								)}
								aria-hidden="true"
							>
								{#if completed}
									<Check class="size-3.5" />
								{:else}
									<Icon class="size-3.5" />
								{/if}
							</span>
							<span class="min-w-0 truncate">{stepLabels[index]}</span>
							{#if completed}
								<span class="sr-only">(completed)</span>
							{/if}
						</button>
					</li>
				{/each}
			</ol>
		</nav>
	</div>

	<OnboardingProfileCard {displayName} class="shrink-0 border-t border-border" />
</div>
