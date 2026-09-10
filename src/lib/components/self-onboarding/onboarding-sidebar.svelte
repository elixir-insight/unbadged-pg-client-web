<script lang="ts">
	import { AlertCircle, Check, Clock, LockIcon } from '$lib/assets/icons';
	import { Progress } from '$lib/components/ui/progress';
	import { cn } from '$lib/utils';
	import OnboardingProfileCard from './onboarding-profile-card.svelte';
	import { flooredStageProgress, STAGES, type StageKey, type StageStatus } from './stages';

	let {
		currentStage,
		currentTabLabel,
		stageStatuses,
		displayName,
		monogram,
		onNavigate
	}: {
		currentStage: StageKey;
		currentTabLabel: string;
		stageStatuses: Record<StageKey, StageStatus>;
		displayName: string;
		monogram: string;
		onNavigate: (key: StageKey) => void;
	} = $props();

	const completedCount = $derived(
		STAGES.filter((stage) => {
			const status = stageStatuses[stage.key];
			return status === 'verified' || status === 'verification_pending';
		}).length
	);
	const currentIndex = $derived(STAGES.findIndex((stage) => stage.key === currentStage));
	const displayPercent = $derived(
		flooredStageProgress(Math.round((completedCount / STAGES.length) * 100), currentIndex)
	);

	function statusCopy(status: StageStatus, isCurrent: boolean, tabLabel: string): string {
		switch (status) {
			case 'verified':
				return 'Verified';
			case 'verification_pending':
				return 'Verification in progress';
			case 'changes_required':
				return 'Changes required';
			case 'locked':
				return 'Locked';
			case 'current':
			case 'draft':
				return isCurrent && tabLabel ? tabLabel : 'In progress';
		}
	}

	function handleActivate(key: StageKey, locked: boolean) {
		if (locked) return;
		onNavigate(key);
	}

	function handleKeydown(event: KeyboardEvent, key: StageKey, locked: boolean) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		handleActivate(key, locked);
	}
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="flex min-h-0 flex-1 flex-col gap-8 px-6 py-6">
		<div class="flex items-center gap-3">
			<div
				class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
				aria-hidden="true"
			>
				{monogram}
			</div>
			<div class="min-w-0">
				<p class="truncate text-h2 font-semibold text-sidebar-foreground">
					{displayName || 'Business onboarding'}
				</p>
				{#if displayName}
					<p class="mt-0.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
						Business onboarding
					</p>
				{/if}
			</div>
		</div>

		<nav aria-label="Onboarding stages" class="min-h-0 flex-1 overflow-y-auto">
			<ol class="flex flex-col">
				{#each STAGES as stage, i (stage.key)}
					{@const status = stageStatuses[stage.key]}
					{@const current = currentStage === stage.key}
					{@const locked = status === 'locked'}
					{@const last = i === STAGES.length - 1}
					{@const subLabel = current
						? `${stage.label} — ${currentTabLabel}`
						: statusCopy(status, current, currentTabLabel)}
					{@const lineComplete =
						status === 'verified' ||
						status === 'verification_pending' ||
						status === 'changes_required' ||
						i < currentIndex}
					<li class={cn('relative flex', !last && 'pb-8')}>
						{#if !last}
							<span
								class={cn(
									'absolute top-8 bottom-0 left-4 w-px -translate-x-1/2',
									lineComplete ? 'bg-primary' : 'bg-border'
								)}
								aria-hidden="true"
							></span>
						{/if}
						<button
							type="button"
							tabindex={0}
							aria-current={current ? 'step' : undefined}
							aria-disabled={locked ? 'true' : undefined}
							aria-label={locked
								? `${stage.label} — complete the previous stage first`
								: `${stage.label}. ${subLabel}`}
							class={cn(
								'relative z-10 flex w-full items-center gap-3 rounded-md text-left transition-colors',
								'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
								locked && 'cursor-not-allowed'
							)}
							onclick={() => handleActivate(stage.key, locked)}
							onkeydown={(event) => handleKeydown(event, stage.key, locked)}
						>
							<span
								class={cn(
									'flex size-8 shrink-0 items-center justify-center rounded-full text-h4 font-medium',
									current && status !== 'changes_required' && status !== 'verification_pending'
										? 'border border-primary bg-background text-foreground'
										: '',
									status === 'verified' && 'bg-primary text-primary-foreground',
									status === 'verification_pending' &&
										'border border-primary bg-background text-primary',
									status === 'changes_required' &&
										'border border-warning bg-warning/8 text-warning',
									status === 'locked' && 'border border-border bg-muted text-muted-foreground',
									status === 'draft' &&
										!current &&
										'border border-border bg-muted text-muted-foreground',
									status === 'current' && 'border border-primary bg-background text-foreground'
								)}
							>
								{#if status === 'verified'}
									<Check class="size-4" />
								{:else if status === 'verification_pending'}
									<Clock class="size-4" />
								{:else if status === 'changes_required'}
									<AlertCircle class="size-4" />
								{:else if status === 'locked'}
									<LockIcon class="size-4" />
								{:else if current}
									<span class="size-2 rounded-full bg-primary" aria-hidden="true"></span>
								{:else}
									{i + 1}
								{/if}
							</span>
							<span class="min-w-0">
								<span
									class={cn(
										'block text-h3',
										current && 'font-semibold text-foreground',
										(status === 'verified' || status === 'verification_pending') &&
											!current &&
											'font-medium text-foreground',
										(status === 'locked' || (status === 'draft' && !current)) &&
											'text-muted-foreground',
										status === 'changes_required' && 'font-medium text-foreground'
									)}
								>
									{stage.label}
								</span>
								<span class="mt-0.5 block text-xs text-muted-foreground">{subLabel}</span>
							</span>
						</button>
					</li>
				{/each}
			</ol>
		</nav>

		<div class="space-y-4">
			<div class="rounded-xl border border-border bg-card p-3">
				<p class="text-sm text-card-foreground">Your progress saves automatically.</p>
			</div>
			<div class="flex items-center justify-between gap-3 text-sm">
				<p class="text-muted-foreground">
					{completedCount} of {STAGES.length} complete
				</p>
				<p class="font-semibold text-primary">{displayPercent}%</p>
			</div>
			<Progress class="h-1.5" value={displayPercent} max={100} aria-label="Onboarding progress" />
		</div>
	</div>

	<OnboardingProfileCard {displayName} class="shrink-0 border-t border-sidebar-border" />
</div>
