<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('col-span-1 h-4 sm:h-5 lg:col-span-2', className)} aria-hidden="true"></div>
