<script lang="ts">
	import { cn } from '$lib/utils';
	import { displayValue } from '$lib/utils/organization-form';

	let {
		label,
		value,
		class: className,
		mono = false,
		spanFull = false
	}: {
		label: string;
		value: string | number | null | undefined;
		class?: string;
		mono?: boolean;
		spanFull?: boolean;
	} = $props();
</script>

<div class={cn('flex items-start gap-x-4 py-0.5', spanFull && 'lg:col-span-2', className)}>
	<dt class="w-[9.5rem] shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">{label}</dt>
	<dd
		class={cn(
			'min-w-0 flex-1 text-sm font-medium break-words text-foreground',
			mono && 'font-mono tracking-wide'
		)}
	>
		{displayValue(value)}
	</dd>
</div>
