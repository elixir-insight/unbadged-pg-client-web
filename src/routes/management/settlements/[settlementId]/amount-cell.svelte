<script lang="ts">
	import { cn } from '$lib/utils';

	let { formatted, negative = false }: { formatted: string; negative?: boolean } = $props();
</script>

<span class={cn('tabular-nums', negative && 'font-medium text-destructive')}>{formatted}</span>
