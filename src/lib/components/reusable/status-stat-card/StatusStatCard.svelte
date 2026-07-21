<script lang="ts" module>
	export type StatusStatCardColor = 'success' | 'destructive' | 'warning';
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	const toneClasses: Record<StatusStatCardColor, { container: string; value: string }> = {
		success: {
			container: 'border-success/40 bg-success/8',
			value: 'text-success'
		},
		destructive: {
			container: 'border-destructive/40 bg-destructive/8',
			value: 'text-destructive'
		},
		warning: {
			container: 'border-warning/40 bg-warning/8',
			value: 'text-warning'
		}
	};

	let {
		label,
		count,
		color = 'success' as StatusStatCardColor,
		class: className
	}: {
		label: string;
		count: number;
		color?: StatusStatCardColor;
		class?: string;
	} = $props();

	const tone = $derived(toneClasses[color]);
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center rounded-lg border px-4 py-4 text-center shadow-xs',
		tone.container,
		className
	)}
>
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
	<p class={cn('mt-2 text-3xl font-semibold tabular-nums', tone.value)}>{count}</p>
</div>
