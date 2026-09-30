<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { InvoiceStatus } from '$lib/types/invoice';

	let { status }: { status: InvoiceStatus } = $props();

	const config = $derived(
		(
			{
				issued: { variant: 'info' as const, label: 'Issued' },
				attempted: { variant: 'warning' as const, label: 'Attempted' },
				overdue: { variant: 'warning' as const, label: 'Overdue' },
				paid: { variant: 'success' as const, label: 'Paid' },
				cancelled: { variant: 'secondary' as const, label: 'Cancelled' },
				expired: { variant: 'outline' as const, label: 'Expired' }
			} satisfies Record<
				InvoiceStatus,
				{ variant: 'info' | 'warning' | 'success' | 'secondary' | 'outline'; label: string }
			>
		)[status]
	);
</script>

<Chip variant={config.variant}>{config.label}</Chip>
