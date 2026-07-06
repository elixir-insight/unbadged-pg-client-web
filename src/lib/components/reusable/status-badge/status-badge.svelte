<script lang="ts" module>
	export type VAStatus = 'Active' | 'Inactive' | 'Reserved' | 'Suspended';

	export const vaStatusConfig: Record<VAStatus, { dot: string; badge: string }> = {
		Active: {
			dot: 'bg-success',
			badge: 'border-success/30 bg-success/8 text-success'
		},
		Inactive: {
			dot: 'bg-muted-foreground/50',
			badge: 'border-border bg-muted/30 text-muted-foreground'
		},
		Reserved: {
			dot: 'bg-warning',
			badge: 'border-warning/30 bg-warning/8 text-warning'
		},
		Suspended: {
			dot: 'bg-destructive',
			badge: 'border-destructive/30 bg-destructive/8 text-destructive'
		}
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		status: VAStatus | string;
		size?: 'sm' | 'md';
		pulse?: boolean;
	}

	const { status, size = 'md', pulse = false }: Props = $props();

	const config = $derived(
		status in vaStatusConfig
			? vaStatusConfig[status as VAStatus]
			: {
					dot: 'bg-muted-foreground/50',
					badge: 'border-border bg-muted/30 text-muted-foreground'
				}
	);
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full border font-medium',
		size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
		config.badge
	)}
>
	<span
		class={cn(
			'shrink-0 rounded-full',
			size === 'sm' ? 'size-1.5' : 'size-2',
			config.dot,
			pulse && 'animate-pulse'
		)}
	></span>
	{status}
</span>
