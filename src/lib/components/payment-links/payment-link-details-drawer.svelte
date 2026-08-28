<script lang="ts">
	import { Details, type DetailSection } from '$lib/components/transactions/collections';
	import { PaymentLinkStatusBadge } from '$lib/components/payment-links';
	import type { PaymentLink } from '$lib/types/payment-link';
	import {
		formatPaymentLinkAmount,
		formatPaymentLinkDate,
		formatPaymentLinkExpiry
	} from '$lib/utils/payment-links-store';

	let { link }: { link: PaymentLink } = $props();

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
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-2">
		<span class="text-sm text-muted-foreground">Status</span>
		<PaymentLinkStatusBadge status={link.status} />
	</div>
	<Details {sections} flat />
</div>
