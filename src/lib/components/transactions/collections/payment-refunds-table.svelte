<script lang="ts">
	import type { PayinRefundDetail } from '$lib/types/payin';
	import RefundStatusBadge from './refund-status-badge.svelte';

	let { refunds }: { refunds: PayinRefundDetail[] } = $props();
</script>

{#if refunds.length === 0}
	<p class="text-sm text-muted-foreground">No refunds for this payment.</p>
{:else}
	<div class="overflow-hidden">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border">
					<th class="py-2.5 text-left font-medium text-muted-foreground">Refund ID</th>
					<th class="py-2.5 text-left font-medium text-muted-foreground">Amount</th>
					<th class="py-2.5 text-left font-medium text-muted-foreground">Type</th>
					<th class="py-2.5 text-left font-medium text-muted-foreground">Status</th>
				</tr>
			</thead>
			<tbody>
				{#each refunds as refund (refund.refundId)}
					<tr class="border-b border-border/40 last:border-b-0">
						<td class="py-3 font-mono text-xs">{refund.refundId}</td>
						<td class="py-3">{refund.refundAmount}</td>
						<td class="py-3 capitalize">{refund.refundType}</td>
						<td class="py-3">
							<RefundStatusBadge status={refund.refundStatus} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
