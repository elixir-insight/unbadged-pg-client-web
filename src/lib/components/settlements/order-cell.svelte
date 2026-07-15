<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let {
		id,
		description,
		adjustedReason
	}: { id: string; description: string; adjustedReason?: string } = $props();
</script>

<button
	type="button"
	onclick={() => goto(resolve('/merchant/transactions/payins/[id]', { id }))}
	class="block text-left focus-visible:outline-none"
>
	<span class="block text-sm font-medium text-foreground hover:underline">{id}</span>
	<span class="block text-xs text-muted-foreground">{description}</span>
</button>
{#if adjustedReason}
	<Chip variant="warning" class="mt-1">{adjustedReason}</Chip>
{/if}
