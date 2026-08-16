<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { disputeStatusChipVariant, formatDisputeStatusLabel } from '$lib/utils/dispute-status';

	interface Props {
		status: string;
		class?: string;
	}

	let { status, class: className }: Props = $props();

	const variant = $derived(disputeStatusChipVariant(status));
	const label = $derived(formatDisputeStatusLabel(status));
</script>

<Chip {variant} class={className}>{label}</Chip>
