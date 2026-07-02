<script lang="ts">
	import type { SystemFlag } from '$lib/types/review';

	let { flag }: { flag: SystemFlag } = $props();

	const isError = $derived(flag.severity === 'error');
</script>

<div
	class={`mt-3 rounded-r-md border-l-2 px-3 py-2 ${isError ? 'border-l-red-400 bg-red-50' : 'border-l-amber-400 bg-amber-50'}`}
>
	<p
		class={`mb-1 text-[9px] font-bold tracking-wider uppercase ${isError ? 'text-red-500' : 'text-amber-500'}`}
	>
		SYSTEM · {flag.checkName}
	</p>
	<p class={`text-[11px] leading-relaxed ${isError ? 'text-red-800' : 'text-amber-800'}`}>
		{flag.message}
	</p>
</div>
