<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import type { SettlementStatus } from './types';

	let { status }: { status: SettlementStatus } = $props();

	const variant: BadgeVariant = $derived(
		status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'warning'
	);
	const label = $derived(
		status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Pending'
	);
</script>

<Chip {variant}>{label}</Chip>
