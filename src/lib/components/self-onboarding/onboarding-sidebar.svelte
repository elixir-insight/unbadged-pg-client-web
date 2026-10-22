<script lang="ts">
	import { Check, CompanyLogoLight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import OnboardingProfileCard from './onboarding-profile-card.svelte';
	import { isStepReachable } from './saved-steps';
	import { STEPS, type StepId, type StepPath } from './steps';

	const stepLabels = STEPS.map((step) => step.title);

	let {
		currentStep,
		completedSteps,
		remarkSteps = [],
		displayName,
		onNavigate
	}: {
		currentStep: StepId;
		/** Steps saved upstream (see savedCompletedSteps) — the only ones that get a checkmark. */
		completedSteps: readonly number[];
		/** Steps with a management remark — reachable even past an unsaved step. */
		remarkSteps?: readonly number[];
		displayName: string;
		onNavigate: (path: StepPath) => void;
	} = $props();
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="flex min-h-0 flex-1 flex-col gap-5 px-5 py-6">
		<CompanyLogoLight class="h-auto w-32" />

		<nav aria-label="Onboarding steps" class="min-h-0 flex-1 overflow-y-auto">
			<ol class="flex flex-col gap-3">
				{#each STEPS as step, index (step.path)}
					{@const id = (index + 1) as StepId}
					{@const current = id === currentStep}
					{@const completed = !current && completedSteps.includes(id)}
					{@const reachable = current || isStepReachable(id, completedSteps, remarkSteps)}
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
									'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium',
									current && 'bg-primary-foreground/15',
									completed && 'bg-primary/10 text-primary',
									!current && !completed && 'border border-border'
								)}
								aria-hidden="true"
							>
								{#if completed}
									<Check class="size-3.5" />
								{:else}
									{id}
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
