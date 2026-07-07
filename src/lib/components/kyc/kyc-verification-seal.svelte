<script lang="ts">
	import { Check } from '$lib/assets/icons';

	let { label = 'Verified' }: { label?: string } = $props();
</script>

<div
	class="absolute -top-4 -right-4 flex size-[3.75rem] rotate-[-9deg] flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-green-500/30 bg-green-500/10 shadow-sm dark:border-green-500/30 dark:bg-green-500/20"
	aria-hidden="true"
>
	<Check class="size-4 text-green-700 dark:text-green-400" strokeWidth={2.5} />
	<span
		class="text-[9px] leading-none font-bold tracking-wide text-green-700 uppercase dark:text-green-400"
	>
		{label}
	</span>
</div>
