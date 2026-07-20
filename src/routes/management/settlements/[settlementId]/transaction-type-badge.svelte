<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import type { TransactionType } from '../types';

	let { type }: { type: TransactionType } = $props();

	const variant: BadgeVariant = $derived(
		type === 'sale' ? 'success' : type === 'refund' ? 'warning' : 'error'
	);
	const label = $derived(type === 'sale' ? 'Sale' : type === 'refund' ? 'Refund' : 'Chargeback');
</script>

<Chip {variant}>{label}</Chip>
