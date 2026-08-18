<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import {
		disputeStatusChipVariant,
		disputeStatusLabel,
		type DisputeStatusOption
	} from '$lib/utils/dispute-status';

	interface Props {
		status: string;
		catalog?: DisputeStatusOption[];
		class?: string;
	}

	let { status, catalog = [], class: className }: Props = $props();

	const variant = $derived(disputeStatusChipVariant(status));
	const label = $derived(disputeStatusLabel(status, catalog));
</script>

<Chip {variant} class={className}>{label}</Chip>
