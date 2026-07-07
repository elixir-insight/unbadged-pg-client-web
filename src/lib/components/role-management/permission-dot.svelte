<script lang="ts">
	import { Check, X } from '$lib/assets/icons';
	import type { PermStatus } from '$lib/stores/role-management/role-management';

	let { status }: { status: PermStatus | undefined } = $props();
</script>

{#if status === 'granted'}
	<div
		class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 shadow"
	>
		<Check class="h-3 w-3 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
	</div>
{:else if status === 'denied'}
	<div
		class="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15 dark:bg-rose-500/20 shadow"
	>
		<X class="h-3 w-3 stroke-[2.5] text-rose-500 dark:text-rose-400" />
	</div>
{:else}
	<div class="h-5 w-5 rounded-full border-2 border-muted-foreground/20 bg-transparent shadow"></div>
{/if}
