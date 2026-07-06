<script lang="ts">
	import { cn } from '$lib/utils';
	import { displayValue } from '$lib/utils/organization-form';

	let {
		label,
		value,
		class: className,
		mono = false
	}: {
		label: string;
		value: string | number | null | undefined;
		class?: string;
		mono?: boolean;
	} = $props();
</script>

<div class={cn('rounded-lg border border-border/60 bg-background/50 px-4 py-3', className)}>
	<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
	<p class={cn('mt-1 text-sm font-medium text-foreground', mono && 'font-mono tracking-wide')}>
		{displayValue(value)}
	</p>
</div>
