<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { PaymentLinkStatus } from '$lib/types/payment-link';

	let { status }: { status: PaymentLinkStatus } = $props();

	const config = $derived(
		(
			{
				issued: { variant: 'info' as const, label: 'Issued' },
				partially_paid: { variant: 'warning' as const, label: 'Partially Paid' },
				paid: { variant: 'success' as const, label: 'Paid' },
				cancelled: { variant: 'secondary' as const, label: 'Cancelled' },
				expired: { variant: 'outline' as const, label: 'Expired' }
			} satisfies Record<
				PaymentLinkStatus,
				{
					variant: 'info' | 'warning' | 'success' | 'secondary' | 'outline';
					label: string;
				}
			>
		)[status]
	);
</script>

<Chip variant={config.variant}>{config.label}</Chip>
