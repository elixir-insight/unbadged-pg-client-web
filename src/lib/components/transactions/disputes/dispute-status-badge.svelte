<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import type { DisputeStatus } from '$lib/utils/management-disputes';

	interface Props {
		status: DisputeStatus;
		class?: string;
	}

	let { status, class: className }: Props = $props();

	const variant = $derived(
		(
			{
				Raised: 'warning',
				Open: 'info',
				'Under review': 'alert',
				Won: 'success',
				Lost: 'error'
			} satisfies Record<DisputeStatus, 'warning' | 'info' | 'alert' | 'success' | 'error'>
		)[status]
	);
</script>

<Chip {variant} class={className}>{status}</Chip>
