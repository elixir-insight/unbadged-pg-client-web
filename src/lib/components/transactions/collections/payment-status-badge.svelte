<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { PayinPaymentStatus } from '$lib/types/payin';

	let { status }: { status: PayinPaymentStatus } = $props();

	const config = $derived(
		(
			{
				pending: { variant: 'warning' as const, label: 'Pending' },
				failed: { variant: 'error' as const, label: 'Failed' },
				authorized: { variant: 'warning' as const, label: 'Authorized' },
				success: { variant: 'success' as const, label: 'Success' },
				refunded: { variant: 'info' as const, label: 'Refunded' }
			} satisfies Record<
				PayinPaymentStatus,
				{ variant: 'warning' | 'error' | 'success' | 'info'; label: string }
			>
		)[status]
	);
</script>

<Chip variant={config.variant}>{config.label}</Chip>
