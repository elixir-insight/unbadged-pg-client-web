<script lang="ts">
	import { cn } from '$lib/utils';

	export interface OnboardingHeaderPill {
		id: string;
		label: string;
		locked: boolean;
	}

	let {
		title,
		subtitle,
		pills,
		activeId,
		onSelect
	}: {
		title: string;
		subtitle: string;
		pills: OnboardingHeaderPill[];
		activeId: string;
		onSelect: (id: string) => void;
	} = $props();
</script>

<div class="rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
	<header class={cn(pills.length > 0 && 'mb-5')}>
		<h1 class="text-lg font-medium">{title}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
	</header>

	{#if pills.length > 0}
		<nav aria-label="Onboarding steps" class="flex gap-0.5 rounded-lg bg-muted p-1">
			{#each pills as pill (pill.id)}
				{@const isActive = pill.id === activeId}
				<button
					type="button"
					aria-current={isActive ? 'step' : undefined}
					aria-disabled={pill.locked ? 'true' : undefined}
					aria-label={pill.locked ? `${pill.label} — complete the previous step first` : pill.label}
					tabindex={pill.locked ? -1 : 0}
					class={cn(
						'flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg px-2 py-1.5 text-sm text-ellipsis whitespace-nowrap transition-colors',
						isActive
							? 'bg-primary font-medium text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground',
						pill.locked && 'pointer-events-none opacity-60'
					)}
					onclick={() => {
						if (pill.locked || isActive) return;
						onSelect(pill.id);
					}}
				>
					{pill.label}
				</button>
			{/each}
		</nav>
	{/if}
</div>
