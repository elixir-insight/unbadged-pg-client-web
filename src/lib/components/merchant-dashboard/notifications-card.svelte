<script module lang="ts">
	export interface NotificationItem {
		label: string;
		timestamp: string;
		tone: 'success' | 'warning' | 'info' | 'critical';
	}
</script>

<script lang="ts">
	import { Bell, CheckCircle2, MessageSquareWarning, Info, XCircle } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		items: NotificationItem[];
		class?: string;
	}

	let { items, class: className }: Props = $props();

	const toneIcon = {
		success: CheckCircle2,
		warning: MessageSquareWarning,
		info: Info,
		critical: XCircle
	} as const;

	const toneClasses = {
		success: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400',
		warning: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
		info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
		critical: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
	} as const;
</script>

<div
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<div class="flex items-center gap-2">
		<Bell class="size-4 text-muted-foreground" />
		<p class="text-sm font-semibold">Notifications</p>
	</div>

	<div class="mt-4 flex flex-1 flex-col divide-y divide-border overflow-hidden">
		{#each items as item (item.label + item.timestamp)}
			{@const Icon = toneIcon[item.tone]}
			<div class="flex flex-1 items-center gap-3">
				<span
					class={cn(
						'flex size-9 shrink-0 items-center justify-center rounded-full',
						toneClasses[item.tone]
					)}
				>
					<Icon class="size-5" />
				</span>
				<span class="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
				<span class="shrink-0 text-xs text-muted-foreground">{item.timestamp}</span>
			</div>
		{/each}
	</div>
</div>
