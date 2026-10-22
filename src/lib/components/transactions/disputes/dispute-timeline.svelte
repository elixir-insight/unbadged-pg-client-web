<script lang="ts">
	import type { Component } from 'svelte';
	import {
		AlertCircle,
		Bell,
		Calendar,
		Check,
		Clock,
		FileText,
		Search,
		ShieldCheck
	} from '$lib/assets/icons';
	import { Chip } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import {
		disputeTimelineIconKind,
		disputeTimelineStep,
		formatDisputeStatusLabel,
		isDisputeTimelineTerminalStatus,
		type DisputeTimelineEventView,
		type DisputeTimelineIconKind
	} from '$lib/utils/dispute-status';

	interface Props {
		events?: DisputeTimelineEventView[];
		eventsError?: string | null;
		status?: string;
		raisedOn?: string;
		evidenceDueBy?: string;
		class?: string;
	}

	interface TimelineStep {
		id: string;
		title: string;
		date: string;
		description: string;
		icon: Component;
		status?: string;
	}

	let {
		events,
		eventsError = null,
		status = '',
		raisedOn = '',
		evidenceDueBy = '',
		class: className
	}: Props = $props();

	const timelineIcons: Record<DisputeTimelineIconKind, Component> = {
		check: Check,
		shield: ShieldCheck,
		search: Search,
		file: FileText,
		bell: Bell,
		calendar: Calendar,
		alert: AlertCircle,
		clock: Clock
	};

	function isLostTimelineStatus(eventStatus: string | undefined): boolean {
		return disputeTimelineIconKind(eventStatus ?? '') === 'alert';
	}

	function iconForStatus(eventStatus: string): Component {
		return timelineIcons[disputeTimelineIconKind(eventStatus)];
	}

	function formatDeadline(value: string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Pending';

		return new Intl.DateTimeFormat('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	const useApiEvents = $derived(events !== undefined);
	const currentStep = $derived.by(() => {
		if (!useApiEvents) return disputeTimelineStep(status);

		const list = events ?? [];
		if (list.length === 0) return 0;

		const lastStatus = list[list.length - 1]?.status ?? '';
		// Terminal outcomes (e.g. Resolved Lost) are completed events, not pending.
		if (isDisputeTimelineTerminalStatus(lastStatus)) {
			return list.length;
		}
		return list.length - 1;
	});

	const fallbackSteps = $derived<TimelineStep[]>([
		{
			id: 'raised',
			title: 'Dispute Raised',
			date: raisedOn,
			description: 'Chargeback received from issuing bank.',
			icon: Check
		},
		{
			id: 'notified',
			title: 'Customer Notified',
			date: currentStep >= 1 ? raisedOn : 'Pending',
			description: 'Automated notification sent to merchant contact.',
			icon: Bell
		},
		{
			id: 'evidence-due',
			title: 'Evidence Due',
			date: formatDeadline(evidenceDueBy),
			description: 'Evidence submission window confirmed.',
			icon: Calendar
		},
		{
			id: 'documents',
			title: 'Documents Uploaded',
			date: currentStep === 3 ? 'In progress' : currentStep > 3 ? 'Uploaded' : 'Pending',
			description: 'Invoice, delivery proof and AVS logs required.',
			icon: FileText
		},
		{
			id: 'review',
			title: 'Under Review',
			date: currentStep === 4 ? 'In progress' : currentStep > 4 ? 'Completed' : 'Pending',
			description: 'Network review typically takes 7–10 days.',
			icon: Search
		},
		{
			id: 'resolved',
			title: 'Resolved',
			date: currentStep === 5 ? formatDisputeStatusLabel(status) : 'Pending',
			description: 'Final decision posted to settlement ledger.',
			icon: ShieldCheck
		}
	]);

	const steps = $derived<TimelineStep[]>(
		useApiEvents
			? (events ?? []).map((event) => ({
					id: event.id,
					title: event.title,
					date: event.date,
					description: event.description,
					status: event.status,
					icon: iconForStatus(event.status)
				}))
			: fallbackSteps
	);
</script>

<section
	class={cn(
		'flex h-full min-h-0 flex-col rounded-xl border border-border bg-background p-6 shadow-sm',
		className
	)}
>
	<div class="flex shrink-0 items-center gap-3">
		<span class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
			<Clock class="size-5" />
		</span>
		<h2 class="text-base font-semibold text-foreground">Dispute Timeline</h2>
	</div>

	{#if eventsError}
		<p class="mt-6 text-sm text-destructive">{eventsError}</p>
	{:else if steps.length === 0}
		<p class="mt-6 text-sm text-muted-foreground">No timeline events yet.</p>
	{:else}
		<ol
			class="relative mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain"
			aria-label="Dispute progress"
		>
			{#each steps as step, index (step.id)}
				{@const Icon = step.icon}
				{@const isCompleted = index < currentStep}
				{@const isCurrent = index === currentStep}
				{@const isLast = index === steps.length - 1}
				{@const isLost = isLostTimelineStatus(step.status)}
				<li class="flex gap-4">
					<div class="flex flex-col items-center">
						<span
							class={cn(
								'flex size-9 shrink-0 items-center justify-center rounded-full border-2',
								isCompleted && !isLost && 'border-primary bg-primary text-primary-foreground',
								isCompleted &&
									isLost &&
									'border-destructive bg-destructive text-destructive-foreground',
								isCurrent && 'border-primary bg-primary/10 text-primary',
								!isCompleted && !isCurrent && 'border-border bg-background text-muted-foreground'
							)}
						>
							{#if isCompleted && isLost}
								<AlertCircle class="size-4" />
							{:else if isCompleted}
								<Check class="size-4" />
							{:else}
								<Icon class="size-4" />
							{/if}
						</span>
						{#if !isLast}
							<div
								class={cn('mt-1 w-px flex-1', index < currentStep ? 'bg-primary/40' : 'bg-border')}
							></div>
						{/if}
					</div>

					<div class={cn('min-w-0 flex-1 pb-10', isLast && 'pb-0')}>
						<div class="flex flex-wrap items-center gap-2">
							<p
								class={cn(
									'text-sm font-semibold',
									isCurrent
										? 'text-primary'
										: isCompleted
											? 'text-foreground'
											: 'text-muted-foreground'
								)}
							>
								{step.title}
							</p>
							{#if isCurrent && (step.date === 'In progress' || step.date === 'Pending')}
								<Chip variant="info" class="h-auto rounded-full px-2 py-0.5 text-xs">
									{step.date}
								</Chip>
							{:else if !isCompleted && !isCurrent}
								<Chip variant="outline" class="h-auto rounded-full px-2 py-0.5 text-xs"
									>Pending</Chip
								>
							{/if}
						</div>
						{#if isCompleted || (isCurrent && step.date !== 'In progress' && step.date !== 'Pending')}
							<p class="mt-0.5 text-xs text-muted-foreground">{step.date}</p>
						{/if}
						{#if step.description}
							<p class="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</section>
