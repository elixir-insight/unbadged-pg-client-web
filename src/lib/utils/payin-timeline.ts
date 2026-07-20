import type { PayinOrderDetail, PayinPaymentDetail, PayinTimelineEntry } from '$lib/types/payin';

function paymentToAttemptEntry(payment: PayinPaymentDetail): PayinTimelineEntry {
	const firstName = payment.customerName.split(' ')[0] ?? payment.customerName;
	const statusLabel =
		payment.paymentStatus === 'success'
			? 'success'
			: payment.paymentStatus === 'failed'
				? 'failed'
				: payment.paymentStatus === 'authorized'
					? 'authorized'
					: 'pending';

	return {
		entryTitle: `${firstName} attempted payment`,
		entryType: 'payment_attempted',
		entryDescription: payment.statusDescription,
		txnAmount: payment.transactionAmount,
		refundAmount: '',
		transactionStatus: statusLabel,
		paymentMethod: payment.paymentMethod,
		paymentChannel: payment.paymentChannel,
		crn: '',
		utr: payment.utr,
		bankRRN: payment.bankRRN,
		cardNumber: payment.cardNumber,
		cardType: payment.cardType,
		transactionMessage: payment.errorDescription ? '' : 'Payment successful',
		errorDescription: payment.errorDescription,
		refundId: '',
		refundSpeed: '',
		refundMode: '',
		refundType: '',
		remark: '',
		timestampMs: payment.paymentTimeline[0]?.timestampMs ?? 0,
		attemptNumber: payment.attemptNumber,
		isCompleted: payment.paymentStatus !== 'pending'
	};
}

export function buildOrderTimeline(
	order: PayinOrderDetail,
	payments: PayinPaymentDetail[]
): PayinTimelineEntry[] {
	const sorted = [...payments].sort((a, b) => a.attemptNumber - b.attemptNumber);
	const entries: PayinTimelineEntry[] = [...order.orderTimeline];

	for (const payment of sorted) {
		entries.push(paymentToAttemptEntry(payment));
	}

	const successful = sorted.find((p) => p.paymentStatus === 'success');
	if (successful) {
		const completion = successful.paymentTimeline.find((e) => e.entryType === 'payment_completed');
		if (completion) {
			entries.push(completion);
		}

		for (const payment of sorted) {
			const refundEntries = payment.paymentTimeline.filter((e) =>
				e.entryType.startsWith('refund_')
			);
			entries.push(...refundEntries);
		}
	}

	return entries.sort((a, b) => a.timestampMs - b.timestampMs);
}
