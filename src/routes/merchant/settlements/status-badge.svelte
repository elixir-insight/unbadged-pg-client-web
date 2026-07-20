<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import type { SettlementStatus } from '$lib/types/settlement';

	let { status }: { status: SettlementStatus } = $props();

	const variant: BadgeVariant = $derived(
		status === 'settled' ? 'success' : status === 'failed' ? 'error' : 'warning'
	);
	const label = $derived(
		status === 'settled' ? 'Settled' : status === 'failed' ? 'Failed' : 'Processing'
	);
</script>

<Chip {variant}>{label}</Chip>
