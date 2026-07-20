<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- scoped navigation appends query params after resolve() */
	import type { PayinPaymentDetail } from '$lib/types/payin';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PaymentStatusBadge from './payment-status-badge.svelte';

	type PaymentDetailPath =
		| '/merchant/transactions/collections/payments/[txnId]'
		| '/management/transactions/collections/payments/[txnId]';

	let {
		payments,
		paymentDetailPath,
		scopeQuery = ''
	}: {
		payments: PayinPaymentDetail[];
		paymentDetailPath: PaymentDetailPath;
		scopeQuery?: string;
	} = $props();
</script>

{#if payments.length === 0}
	<p class="text-sm text-muted-foreground">No payment attempts for this order yet.</p>
{:else}
	<div class="overflow-hidden">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border">
					<th class="py-2.5 text-left font-medium text-muted-foreground">Transaction ID</th>
					<th class="py-2.5 text-left font-medium text-muted-foreground">Attempt</th>
					<th class="py-2.5 text-left font-medium text-muted-foreground">Method</th>
					<th class="py-2.5 text-left font-medium text-muted-foreground">Status</th>
				</tr>
			</thead>
			<tbody>
				{#each payments as payment (payment.txnId)}
					<tr
						class="cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
						onclick={() =>
							goto(`${resolve(paymentDetailPath, { txnId: payment.txnId })}${scopeQuery}`)}
					>
						<td class="py-3 font-mono text-xs">{payment.txnId}</td>
						<td class="py-3">{payment.attemptNumber}</td>
						<td class="py-3">{payment.paymentMethod}</td>
						<td class="py-3">
							<PaymentStatusBadge status={payment.paymentStatus} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
