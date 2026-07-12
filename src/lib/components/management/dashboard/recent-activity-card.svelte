<script module lang="ts">
	import type { Component } from 'svelte';

	export type ActivityType = 'onboarding' | 'settlement' | 'transaction' | 'alert';

	export interface ActivityItem {
		id: string;
		type: ActivityType;
		title: string;
		description: string;
		timestamp: string;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import { UserPlus, Landmark, ArrowLeftRight, AlertCircle } from '$lib/assets/icons';

	let { activities, class: className }: { activities: ActivityItem[]; class?: string } = $props();

	const TYPE_META: Record<ActivityType, { icon: Component; classes: string }> = {
		onboarding: { icon: UserPlus, classes: 'bg-primary/10 text-primary' },
		settlement: {
			icon: Landmark,
			classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
		},
		transaction: {
			icon: ArrowLeftRight,
			classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
		},
		alert: { icon: AlertCircle, classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
	};
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">Recent activity</Card.Title>
		<Card.Description class="text-xs">Latest events across your platform</Card.Description>
	</Card.Header>

	<Card.Content class="min-h-0 flex-1 overflow-y-auto">
		<ul class="flex flex-col divide-y divide-border">
			{#each activities as activity (activity.id)}
				{@const meta = TYPE_META[activity.type]}
				{@const Icon = meta.icon}
				<li class="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
					<div
						class={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', meta.classes)}
						aria-hidden="true"
					>
						<Icon class="size-4" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs font-semibold text-foreground">{activity.title}</p>
						<p class="truncate text-[11px] text-muted-foreground">{activity.description}</p>
					</div>
					<span class="shrink-0 text-[11px] text-muted-foreground tabular-nums"
						>{activity.timestamp}</span
					>
				</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
