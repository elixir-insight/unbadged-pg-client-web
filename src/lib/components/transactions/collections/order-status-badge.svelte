<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { PayinOrderStatus } from '$lib/types/payin';

	let { status }: { status: PayinOrderStatus } = $props();

	const config = $derived(
		(
			{
				created: { variant: 'outline' as const, label: 'Created' },
				pending: { variant: 'warning' as const, label: 'Pending' },
				success: { variant: 'success' as const, label: 'Success' },
				failed: { variant: 'error' as const, label: 'Failed' },
				expired: { variant: 'outline' as const, label: 'Expired' }
			} satisfies Record<
				PayinOrderStatus,
				{ variant: 'outline' | 'warning' | 'success' | 'error'; label: string }
			>
		)[status]
	);
</script>

<Chip variant={config.variant}>{config.label}</Chip>
