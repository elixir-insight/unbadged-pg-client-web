<script lang="ts">
	import type { PartnerSettlementStatus } from './types';
	import { Chip } from '$lib/components/reusable';
	import { STATUS_CHIP_VARIANT, STATUS_LABEL } from './shared';

	let { status }: { status: PartnerSettlementStatus } = $props();
</script>

<Chip variant={STATUS_CHIP_VARIANT[status]}>{STATUS_LABEL[status]}</Chip>
