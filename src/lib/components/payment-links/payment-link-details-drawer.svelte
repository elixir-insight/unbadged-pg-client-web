<script lang="ts">
	import { Details, type DetailSection } from '$lib/components/transactions/collections';
	import PaymentLinkStatusBadge from './payment-link-status-badge.svelte';
	import { Button, Modal, toast } from '$lib/components/reusable';
	import { cancelPaymentLinkRequest } from '$lib/api/payment-links';
	import type { PaymentLink } from '$lib/types/payment-link';
	import { mapPaymentLinkStatus } from '$lib/utils/payment-link-map';
	import {
		formatPaymentLinkAmount,
		formatPaymentLinkDate,
		formatPaymentLinkExpiry
	} from '$lib/utils/payment-links-store';

	let {
		link,
		onCancelled,
		confirmOpen = $bindable(false)
	}: {
		link: PaymentLink;
		onCancelled?: (link: PaymentLink) => void;
		confirmOpen?: boolean;
	} = $props();
	let cancelling = $state(false);

	const sections = $derived<DetailSection[]>([
		{
			title: 'Payment link',
			rows: [
				{ label: 'Payment For', value: link.paymentFor, bold: true },
				{
					label: 'Partial Payment',
					value: link.partialPaymentEnabled ? 'Enabled' : 'Disabled'
				},
				{ label: 'Amount', value: formatPaymentLinkAmount(link.amount), bold: true },
				{ label: 'Amount Paid', value: formatPaymentLinkAmount(link.amountPaid) },
				{ label: 'Link URL', value: link.paymentLinkUrl, copyable: true, mono: true },
				...(link.transactionId
					? [{ label: 'Transaction ID', value: link.transactionId, copyable: true, mono: true }]
					: [])
			]
		},
		{
			title: 'Customer',
			rows: [
				{ label: 'Email', value: link.customerEmail ?? '—', mono: true },
				{ label: 'Phone', value: link.customerPhone ?? '—', mono: true }
			]
		},
		{
			title: 'Metadata',
			rows: [
				{ label: 'Payment Link ID', value: link.id, copyable: true, mono: true },
				{ label: 'Receipt No.', value: link.receiptNo ?? '—', mono: true },
				{ label: 'Created By', value: link.createdBy },
				{ label: 'Created At', value: formatPaymentLinkDate(link.createdAt) },
				{ label: 'Expires On', value: formatPaymentLinkExpiry(link.expiresOn) }
			]
		}
	]);

	async function confirmCancel() {
		if (cancelling) return;
		cancelling = true;
		try {
			const result = await cancelPaymentLinkRequest(link.id);
			toast.success(result.message || 'Payment link cancelled');
			confirmOpen = false;
			onCancelled?.({
				...link,
				status: mapPaymentLinkStatus(result.status || 'cancelled')
			});
		} catch (error) {
			toast.error('Failed to cancel payment link', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			cancelling = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-2">
		<span class="text-sm text-muted-foreground">Status</span>
		<PaymentLinkStatusBadge status={link.status} />
	</div>
	<Details {sections} flat />
</div>

<Modal
	bind:open={confirmOpen}
	title="Cancel payment link"
	description="This will stop customers from paying on this link. This cannot be undone."
>
	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button
				type="button"
				variant="outline"
				class="w-full sm:w-auto"
				disabled={cancelling}
				onclick={() => (confirmOpen = false)}
			>
				Keep link
			</Button>
			<Button
				type="button"
				variant="destructive"
				class="w-full sm:w-auto"
				disabled={cancelling}
				onclick={confirmCancel}
			>
				{cancelling ? 'Cancelling…' : 'Cancel payment link'}
			</Button>
		</div>
	{/snippet}
</Modal>
