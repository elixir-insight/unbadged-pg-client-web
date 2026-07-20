<script lang="ts">
	import { Check, Minus, X } from '$lib/assets/icons';
	import type { PermStatus } from '$lib/stores/role-management/role-management';

	let { status }: { status: PermStatus | undefined } = $props();
</script>

{#if status === 'granted'}
	<div
		class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 shadow dark:bg-emerald-500/20"
		aria-label="Granted"
	>
		<Check class="h-3 w-3 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
	</div>
{:else if status === 'denied'}
	<div
		class="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15 shadow dark:bg-rose-500/20"
		aria-label="Not granted"
	>
		<X class="h-3 w-3 stroke-[2.5] text-rose-500 dark:text-rose-400" />
	</div>
{:else}
	<!-- No permission field for this module (unavailable) -->
	<div
		class="flex h-5 w-5 items-center justify-center rounded-full bg-muted shadow"
		aria-label="Not available"
	>
		<Minus class="h-3 w-3 stroke-[2.5] text-muted-foreground" />
	</div>
{/if}
