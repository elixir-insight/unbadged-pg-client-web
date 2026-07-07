<script lang="ts" module>
	import type { BadgeVariant } from '$lib/components/ui/badge';

	export const VA_STATUSES = [
		'ACTIVE',
		'IN_ACTIVE',
		'ON_HOLD',
		'RESERVE',
		'FROZEN',
		'DISABLED',
		'LIEN_MARK'
	] as const;

	export type VAStatus = (typeof VA_STATUSES)[number];

	export const vaStatusConfig: Record<VAStatus, { dot: string; badge: string }> = {
		ACTIVE: {
			dot: 'bg-success',
			badge: 'border-success/30 bg-success/8 text-success'
		},
		IN_ACTIVE: {
			dot: 'bg-muted-foreground/50',
			badge: 'border-border bg-muted/30 text-muted-foreground'
		},
		ON_HOLD: {
			dot: 'bg-warning',
			badge: 'border-warning/30 bg-warning/8 text-warning'
		},
		RESERVE: {
			dot: 'bg-info',
			badge: 'border-info/30 bg-info/8 text-info'
		},
		FROZEN: {
			dot: 'bg-destructive',
			badge: 'border-destructive/30 bg-destructive/8 text-destructive'
		},
		DISABLED: {
			dot: 'bg-muted-foreground/50',
			badge: 'border-border bg-muted/30 text-muted-foreground'
		},
		LIEN_MARK: {
			dot: 'bg-destructive',
			badge: 'border-destructive/30 bg-destructive/8 text-destructive'
		}
	};

	export const vaStatusChipVariant: Record<VAStatus, BadgeVariant> = {
		ACTIVE: 'success',
		IN_ACTIVE: 'disabled',
		ON_HOLD: 'warning',
		RESERVE: 'info',
		FROZEN: 'error',
		DISABLED: 'disabled',
		LIEN_MARK: 'error'
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { formatStatusLabel } from '$lib/utils/status_rename';

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

	const statusLabel = $derived(formatStatusLabel(status));
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
	{statusLabel}
</span>
