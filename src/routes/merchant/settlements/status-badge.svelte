<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	let { status }: { status: string } = $props();

	const variant: BadgeVariant = $derived(
		status === 'success' ? 'success' : status === 'reject' ? 'error' : 'warning'
	);
	const label = $derived(
		status === 'success' ? 'Success' : status === 'reject' ? 'Reject' : 'In Review'
	);
</script>

<Chip {variant}>{label}</Chip>
