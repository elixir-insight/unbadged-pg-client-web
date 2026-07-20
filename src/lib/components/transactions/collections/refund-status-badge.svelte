<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { PayinRefundStatus } from '$lib/types/payin';

	let { status }: { status: PayinRefundStatus } = $props();

	const config = $derived(
		(
			{
				initiated: { variant: 'warning' as const, label: 'Initiated' },
				processing: { variant: 'info' as const, label: 'Processing' },
				completed: { variant: 'success' as const, label: 'Completed' },
				failed: { variant: 'error' as const, label: 'Failed' }
			} satisfies Record<
				PayinRefundStatus,
				{ variant: 'warning' | 'info' | 'success' | 'error'; label: string }
			>
		)[status]
	);
</script>

<Chip variant={config.variant}>{config.label}</Chip>
