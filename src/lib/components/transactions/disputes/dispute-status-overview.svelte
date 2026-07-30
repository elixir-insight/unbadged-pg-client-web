<script lang="ts">
	import { ActivityIcon, Clock } from '$lib/assets/icons';
	import type { DisputeStatus } from '$lib/utils/management-disputes';

	interface Props {
		status: DisputeStatus;
		evidenceDueBy: string;
	}

	let { status, evidenceDueBy }: Props = $props();

	const currentStage = $derived(
		status === 'Raised'
			? 'Dispute Raised'
			: status === 'Open'
				? 'Evidence Collection'
				: status === 'Under review'
					? 'Network Review'
					: 'Resolved'
	);

	const evidenceDueDate = $derived.by(() => {
		const date = new Date(evidenceDueBy);
		if (Number.isNaN(date.getTime())) return 'Not available';

		return new Intl.DateTimeFormat('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	});

	const daysRemaining = $derived.by(() => {
		const deadlineValue = /^\d{4}-\d{2}-\d{2}$/.test(evidenceDueBy)
			? `${evidenceDueBy}T23:59:59`
			: evidenceDueBy;
		const deadline = new Date(deadlineValue).getTime();
		if (Number.isNaN(deadline)) return 0;

		const millisecondsPerDay = 24 * 60 * 60 * 1000;
		return Math.max(0, Math.ceil((deadline - Date.now()) / millisecondsPerDay));
	});

	const remainingProgress = $derived(Math.min(100, (daysRemaining / 7) * 100));
</script>

<section class="rounded-xl border border-border bg-background p-4 shadow-sm">
	<div class="flex items-center gap-3">
		<span class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
			<ActivityIcon class="size-5" />
		</span>
		<h2 class="text-base font-semibold text-foreground">Status Overview</h2>
	</div>

	<div class="mt-4 flex flex-col gap-8">
		<div>
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
				Current stage
			</p>
			<p class="mt-1 text-base font-semibold text-primary">{currentStage}</p>
		</div>

		<div>
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Evidence due</p>
			<p class="mt-1 text-base font-semibold text-foreground">{evidenceDueDate}</p>
		</div>

		<div class="rounded-lg bg-primary/5 p-3">
			<div class="flex items-center gap-2 text-primary">
				<Clock class="size-4" />
				<p class="text-xs font-medium tracking-wider uppercase">SLA remaining</p>
			</div>
			<p class="mt-2 text-lg font-semibold text-primary">
				{daysRemaining}
				{daysRemaining === 1 ? 'Day' : 'Days'} Remaining
			</p>
			<div
				role="progressbar"
				aria-valuenow={remainingProgress}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="{daysRemaining} days remaining before evidence is due"
				class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
			>
				<div
					class="h-full rounded-full bg-primary transition-all"
					style="width: {remainingProgress}%"
				></div>
			</div>
		</div>
	</div>
</section>
