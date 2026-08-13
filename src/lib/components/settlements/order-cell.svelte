<script lang="ts">
	import { Chip } from '$lib/components/reusable';

	let {
		id,
		description,
		adjustedReason
	}: { id: string; description: string; adjustedReason?: string } = $props();
</script>

<div>
	<span class="block text-sm font-medium text-foreground">{id}</span>
	<span class="block text-xs text-muted-foreground">{description}</span>
	{#if adjustedReason}
		<Chip variant="warning" class="mt-1">{adjustedReason}</Chip>
	{/if}
</div>
