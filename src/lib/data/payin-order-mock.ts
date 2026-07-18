import type {
	PayinOrderDetail,
	PayinOrderListItem,
	PayinPaymentDetail,
	PayinPaymentListItem,
	PayinTimelineEntry
} from '$lib/types/payin';

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const now = Date.now();

function timelineEntry(
	partial: Omit<PayinTimelineEntry, 'refundAmount' | 'remark'> &
		Partial<Pick<PayinTimelineEntry, 'refundAmount' | 'remark'>>
): PayinTimelineEntry {
	return { refundAmount: '', remark: '', ...partial };
}

function fmtDate(ms: number): string {
	return new Date(ms).toLocaleString('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

interface PayinCatalogEntry {
	order: PayinOrderDetail;
	payments: PayinPaymentDetail[];
}

const catalog: PayinCatalogEntry[] = [
	{
		order: {
			orderId: 'ORD-2026-001',
			crn: 'CRN2026062700001',
			customerName: 'Arjun Mehta',
			customerEmail: 'arjun.mehta@example.com',
			customerPhoneNumber: '+91 98765 43210',
			orderAmount: '₹4,500.00',
			orderStatus: 'success',
			statusDescription: 'Payment received successfully',
			clientDescription: 'Order payment for INV-2024-001',
			createdAt: fmtDate(now - 1 * DAY_MS),
			expiresAt: '2026-06-28',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹4,500.00',
					transactionStatus: 'pending',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026062700001',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 1 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: [
			{
				txnId: 'TXN-1001',
				orderId: 'ORD-2026-001',
				attemptNumber: 1,
				customerName: 'Arjun Mehta',
				transactionAmount: '₹4,500.00',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT',
				paymentStatus: 'success',
				statusDescription: 'Customer approved the request in their UPI app.',
				utr: 'AXISC2706270001',
				bankRRN: '442109887651',
				cardNumber: '',
				cardType: '',
				errorDescription: '',
				payerVpa: 'arjun@okaxis',
				bankPipelineCode: 'AXIS',
				processingFee: '₹45.00',
				gatewayFee: '₹22.50',
				gatewayGst: '₹4.05',
				partnerFee: '₹10.00',
				partnerGst: '₹1.80',
				refundableAmount: '₹3,428.45',
				refunds: [
					{
						refundId: 'REF-2026-001',
						txnId: 'TXN-1001',
						orderId: 'ORD-2026-001',
						customerName: 'Arjun Mehta',
						originalAmount: '₹4,500.00',
						refundAmount: '₹1,000.00',
						refundStatus: 'completed',
						refundType: 'partial',
						refundSpeed: 'Instant',
						refundMode: 'UPI',
						remark: 'Customer requested partial refund for duplicate charge',
						createdAt: fmtDate(now - 1 * DAY_MS + 6 * MINUTE_MS),
						refundTimeline: []
					}
				],
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Arjun authorised the payment',
						entryType: 'payment_authorized',
						entryDescription: 'Customer approved the request in their UPI app.',
						txnAmount: '₹4,500.00',
						transactionStatus: 'authorized',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062700001',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: '',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 1 * DAY_MS + 2 * MINUTE_MS,
						isCompleted: true
					}),
					timelineEntry({
						entryTitle: "Payment's complete",
						entryType: 'payment_completed',
						entryDescription: 'We received ₹4,500.00 from Arjun Mehta.',
						txnAmount: '₹4,500.00',
						transactionStatus: 'success',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062700001',
						utr: 'AXISC2706270001',
						bankRRN: '442109887651',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Payment successful',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 1 * DAY_MS + 4 * MINUTE_MS,
						isCompleted: true
					}),
					timelineEntry({
						entryTitle: 'Refund initiated',
						entryType: 'refund_initiated',
						entryDescription: 'Partial refund of ₹1,000.00 initiated to Arjun Mehta.',
						txnAmount: '₹4,500.00',
						refundAmount: '₹1,000.00',
						transactionStatus: 'pending',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062700001',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: '',
						errorDescription: '',
						refundId: 'REF-2026-001',
						refundSpeed: 'Instant',
						refundMode: 'UPI',
						refundType: 'Partial',
						remark: 'Customer requested partial refund for duplicate charge',
						timestampMs: now - 1 * DAY_MS + 5 * MINUTE_MS,
						isCompleted: true
					}),
					timelineEntry({
						entryTitle: 'Refund completed',
						entryType: 'refund_completed',
						entryDescription: '₹1,000.00 refunded to arjun@okaxis.',
						txnAmount: '₹4,500.00',
						refundAmount: '₹1,000.00',
						transactionStatus: 'success',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062700001',
						utr: 'AXISC2706270002',
						bankRRN: '442109887660',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Refund successful',
						errorDescription: '',
						refundId: 'REF-2026-001',
						refundSpeed: 'Instant',
						refundMode: 'UPI',
						refundType: 'Partial',
						remark: 'Customer requested partial refund for duplicate charge',
						timestampMs: now - 1 * DAY_MS + 6 * MINUTE_MS,
						isCompleted: true
					})
				]
			}
		]
	},
	{
		order: {
			orderId: 'ORD-2026-002',
			crn: 'CRN2026062600002',
			customerName: 'Priya Sharma',
			customerEmail: 'priya.sharma@example.com',
			customerPhoneNumber: '+91 87654 32109',
			orderAmount: '₹12,000.00',
			orderStatus: 'pending',
			statusDescription: 'Awaiting bank confirmation',
			clientDescription: 'Subscription renewal payment',
			createdAt: fmtDate(now - 2 * DAY_MS),
			expiresAt: '2026-06-27',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹12,000.00',
					transactionStatus: 'pending',
					paymentMethod: 'Net Banking',
					paymentChannel: 'NETBANKING',
					crn: 'CRN2026062600002',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 2 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: [
			{
				txnId: 'TXN-1002',
				orderId: 'ORD-2026-002',
				attemptNumber: 1,
				customerName: 'Priya Sharma',
				transactionAmount: '₹12,000.00',
				paymentMethod: 'Net Banking',
				paymentChannel: 'NETBANKING',
				paymentStatus: 'pending',
				statusDescription: 'Customer started payment via HDFC Net Banking.',
				utr: '',
				bankRRN: '',
				cardNumber: '',
				cardType: '',
				errorDescription: '',
				payerVpa: '',
				bankPipelineCode: 'HDFC',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Priya initiated payment',
						entryType: 'payment_initiated',
						entryDescription: 'Customer started payment via HDFC Net Banking.',
						txnAmount: '₹12,000.00',
						transactionStatus: 'pending',
						paymentMethod: 'Net Banking',
						paymentChannel: 'NETBANKING',
						crn: 'CRN2026062600002',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: '',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 2 * DAY_MS + 3 * MINUTE_MS,
						isCompleted: false
					})
				]
			}
		]
	},
	{
		order: {
			orderId: 'ORD-2026-003',
			crn: 'CRN2026062500003',
			customerName: 'Vikram Nair',
			customerEmail: 'vikram.nair@example.com',
			customerPhoneNumber: '+91 76543 21098',
			orderAmount: '₹2,750.00',
			orderStatus: 'success',
			statusDescription: 'Payment received after 3 attempts',
			clientDescription: 'Product purchase',
			createdAt: fmtDate(now - 3 * DAY_MS),
			expiresAt: '2026-06-26',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹2,750.00',
					transactionStatus: 'pending',
					paymentMethod: 'Credit Card',
					paymentChannel: 'CARD',
					crn: 'CRN2026062500003',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 3 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: [
			{
				txnId: 'TXN-3001',
				orderId: 'ORD-2026-003',
				attemptNumber: 1,
				customerName: 'Vikram Nair',
				transactionAmount: '₹2,750.00',
				paymentMethod: 'Credit Card',
				paymentChannel: 'CARD',
				paymentStatus: 'failed',
				statusDescription: 'Customer attempted payment with Visa credit card.',
				utr: '',
				bankRRN: 'ICICI2062500001',
				cardNumber: 'XXXX XXXX XXXX 4242',
				cardType: 'VISA',
				errorDescription: 'Insufficient funds in account',
				payerVpa: '',
				bankPipelineCode: 'ICICI',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Vikram attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer attempted payment with Visa credit card.',
						txnAmount: '₹2,750.00',
						transactionStatus: 'failed',
						paymentMethod: 'Credit Card',
						paymentChannel: 'CARD',
						crn: 'CRN2026062500003',
						utr: '',
						bankRRN: 'ICICI2062500001',
						cardNumber: 'XXXX XXXX XXXX 4242',
						cardType: 'VISA',
						transactionMessage: 'Transaction declined',
						errorDescription: 'Insufficient funds in account',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 3 * DAY_MS + 3 * MINUTE_MS,
						attemptNumber: 1,
						isCompleted: true
					})
				]
			},
			{
				txnId: 'TXN-3002',
				orderId: 'ORD-2026-003',
				attemptNumber: 2,
				customerName: 'Vikram Nair',
				transactionAmount: '₹2,750.00',
				paymentMethod: 'Credit Card',
				paymentChannel: 'CARD',
				paymentStatus: 'failed',
				statusDescription: 'Customer retried with Visa credit card.',
				utr: '',
				bankRRN: 'ICICI2062500002',
				cardNumber: 'XXXX XXXX XXXX 4242',
				cardType: 'VISA',
				errorDescription: 'Bank did not respond in time',
				payerVpa: '',
				bankPipelineCode: 'ICICI',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Vikram attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer retried with Visa credit card.',
						txnAmount: '₹2,750.00',
						transactionStatus: 'failed',
						paymentMethod: 'Credit Card',
						paymentChannel: 'CARD',
						crn: 'CRN2026062500003',
						utr: '',
						bankRRN: 'ICICI2062500002',
						cardNumber: 'XXXX XXXX XXXX 4242',
						cardType: 'VISA',
						transactionMessage: 'Transaction timed out',
						errorDescription: 'Bank did not respond in time',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 3 * DAY_MS + 8 * MINUTE_MS,
						attemptNumber: 2,
						isCompleted: true
					})
				]
			},
			{
				txnId: 'TXN-3003',
				orderId: 'ORD-2026-003',
				attemptNumber: 3,
				customerName: 'Vikram Nair',
				transactionAmount: '₹2,750.00',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT',
				paymentStatus: 'success',
				statusDescription: 'Customer switched to UPI and approved the payment.',
				utr: 'ICICI2506250003',
				bankRRN: '882109887652',
				cardNumber: '',
				cardType: '',
				errorDescription: '',
				payerVpa: 'vikram@okicici',
				bankPipelineCode: 'ICICI',
				processingFee: '₹27.50',
				gatewayFee: '₹13.75',
				gatewayGst: '₹2.48',
				partnerFee: '₹5.00',
				partnerGst: '₹0.90',
				refundableAmount: '₹1,906.27',
				refunds: [
					{
						refundId: 'REF-2026-002',
						txnId: 'TXN-3003',
						orderId: 'ORD-2026-003',
						customerName: 'Vikram Nair',
						originalAmount: '₹2,750.00',
						refundAmount: '₹800.00',
						refundStatus: 'processing',
						refundType: 'partial',
						refundSpeed: 'Normal',
						refundMode: 'UPI',
						remark: 'Product return — refund in progress',
						createdAt: fmtDate(now - 2 * DAY_MS + 10 * MINUTE_MS),
						refundTimeline: []
					}
				],
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Vikram attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer switched to UPI and approved the payment.',
						txnAmount: '₹2,750.00',
						transactionStatus: 'success',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062500003',
						utr: 'ICICI2506250003',
						bankRRN: '882109887652',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Payment successful',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 3 * DAY_MS + 15 * MINUTE_MS,
						attemptNumber: 3,
						isCompleted: true
					}),
					timelineEntry({
						entryTitle: "Payment's complete",
						entryType: 'payment_completed',
						entryDescription: 'We received ₹2,750.00 from Vikram Nair.',
						txnAmount: '₹2,750.00',
						transactionStatus: 'success',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062500003',
						utr: 'ICICI2506250003',
						bankRRN: '882109887652',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Payment successful',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 3 * DAY_MS + 17 * MINUTE_MS,
						isCompleted: true
					}),
					timelineEntry({
						entryTitle: 'Refund initiated',
						entryType: 'refund_initiated',
						entryDescription: 'Partial refund of ₹800.00 initiated to Vikram Nair.',
						txnAmount: '₹2,750.00',
						refundAmount: '₹800.00',
						transactionStatus: 'pending',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062500003',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: '',
						errorDescription: '',
						refundId: 'REF-2026-002',
						refundSpeed: 'Normal',
						refundMode: 'UPI',
						refundType: 'Partial',
						remark: 'Product return — refund in progress',
						timestampMs: now - 2 * DAY_MS + 10 * MINUTE_MS,
						isCompleted: false
					})
				]
			}
		]
	},
	{
		order: {
			orderId: 'ORD-2026-004',
			crn: 'CRN2026062400004',
			customerName: 'Sneha Iyer',
			customerEmail: 'sneha.iyer@example.com',
			customerPhoneNumber: '+91 91234 56780',
			orderAmount: '₹8,200.00',
			orderStatus: 'created',
			statusDescription: 'Payment link sent, awaiting customer',
			clientDescription: 'Invoice payment',
			createdAt: fmtDate(now - 5 * DAY_MS),
			expiresAt: '2026-06-25',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹8,200.00',
					transactionStatus: 'pending',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026062400004',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 5 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: []
	},
	{
		order: {
			orderId: 'ORD-2026-006',
			crn: 'CRN2026062200006',
			customerName: 'Kavya Reddy',
			customerEmail: 'kavya.reddy@example.com',
			customerPhoneNumber: '+91 87654 32100',
			orderAmount: '₹6,800.00',
			orderStatus: 'pending',
			statusDescription: 'Payment in progress',
			clientDescription: 'Service fee',
			createdAt: fmtDate(now - 9 * DAY_MS),
			expiresAt: '2026-06-23',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹6,800.00',
					transactionStatus: 'pending',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026062200006',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 9 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: [
			{
				txnId: 'TXN-6001',
				orderId: 'ORD-2026-006',
				attemptNumber: 1,
				customerName: 'Kavya Reddy',
				transactionAmount: '₹6,800.00',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT',
				paymentStatus: 'pending',
				statusDescription: 'Customer opened UPI app, awaiting approval.',
				utr: '',
				bankRRN: '',
				cardNumber: '',
				cardType: '',
				errorDescription: '',
				payerVpa: 'kavya@okaxis',
				bankPipelineCode: 'AXIS',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Kavya initiated payment',
						entryType: 'payment_initiated',
						entryDescription: 'Customer opened UPI app, awaiting approval.',
						txnAmount: '₹6,800.00',
						transactionStatus: 'pending',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062200006',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: '',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 9 * DAY_MS + 5 * MINUTE_MS,
						isCompleted: false
					})
				]
			}
		]
	},
	{
		order: {
			orderId: 'ORD-2026-008',
			crn: 'CRN2026062200008',
			customerName: 'Divya Krishnan',
			customerEmail: 'divya.krishnan@example.com',
			customerPhoneNumber: '+91 91234 56789',
			orderAmount: '₹3,200.00',
			orderStatus: 'failed',
			statusDescription: 'All payment attempts failed',
			clientDescription: 'Online course enrollment',
			createdAt: fmtDate(now - 14 * DAY_MS),
			expiresAt: '2026-06-23',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹3,200.00',
					transactionStatus: 'pending',
					paymentMethod: 'Credit Card',
					paymentChannel: 'CARD',
					crn: 'CRN2026062200008',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 14 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: [
			{
				txnId: 'TXN-8001',
				orderId: 'ORD-2026-008',
				attemptNumber: 1,
				customerName: 'Divya Krishnan',
				transactionAmount: '₹3,200.00',
				paymentMethod: 'Credit Card',
				paymentChannel: 'CARD',
				paymentStatus: 'failed',
				statusDescription: 'Customer attempted payment with Mastercard credit card.',
				utr: '',
				bankRRN: 'HDFC2062200001',
				cardNumber: 'XXXX XXXX XXXX 5512',
				cardType: 'MASTERCARD',
				errorDescription: 'Insufficient funds in account',
				payerVpa: '',
				bankPipelineCode: 'HDFC',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Divya attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer attempted payment with Mastercard credit card.',
						txnAmount: '₹3,200.00',
						transactionStatus: 'failed',
						paymentMethod: 'Credit Card',
						paymentChannel: 'CARD',
						crn: 'CRN2026062200008',
						utr: '',
						bankRRN: 'HDFC2062200001',
						cardNumber: 'XXXX XXXX XXXX 5512',
						cardType: 'MASTERCARD',
						transactionMessage: 'Transaction declined',
						errorDescription: 'Insufficient funds in account',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 14 * DAY_MS + 4 * MINUTE_MS,
						attemptNumber: 1,
						isCompleted: true
					})
				]
			},
			{
				txnId: 'TXN-8002',
				orderId: 'ORD-2026-008',
				attemptNumber: 2,
				customerName: 'Divya Krishnan',
				transactionAmount: '₹3,200.00',
				paymentMethod: 'Credit Card',
				paymentChannel: 'CARD',
				paymentStatus: 'failed',
				statusDescription: 'Customer retried with the same credit card.',
				utr: '',
				bankRRN: 'HDFC2062200002',
				cardNumber: 'XXXX XXXX XXXX 5512',
				cardType: 'MASTERCARD',
				errorDescription: '3D Secure verification failed',
				payerVpa: '',
				bankPipelineCode: 'HDFC',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Divya attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer retried with the same credit card.',
						txnAmount: '₹3,200.00',
						transactionStatus: 'failed',
						paymentMethod: 'Credit Card',
						paymentChannel: 'CARD',
						crn: 'CRN2026062200008',
						utr: '',
						bankRRN: 'HDFC2062200002',
						cardNumber: 'XXXX XXXX XXXX 5512',
						cardType: 'MASTERCARD',
						transactionMessage: 'Authentication failed',
						errorDescription: '3D Secure verification failed',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 14 * DAY_MS + 11 * MINUTE_MS,
						attemptNumber: 2,
						isCompleted: true
					})
				]
			},
			{
				txnId: 'TXN-8003',
				orderId: 'ORD-2026-008',
				attemptNumber: 3,
				customerName: 'Divya Krishnan',
				transactionAmount: '₹3,200.00',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT',
				paymentStatus: 'failed',
				statusDescription: 'Customer switched to UPI but did not complete the payment.',
				utr: '',
				bankRRN: '',
				cardNumber: '',
				cardType: '',
				errorDescription: 'Customer did not approve the UPI request in time',
				payerVpa: '',
				bankPipelineCode: 'HDFC',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Divya attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer switched to UPI but did not complete the payment.',
						txnAmount: '₹3,200.00',
						transactionStatus: 'failed',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026062200008',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Payment expired',
						errorDescription: 'Customer did not approve the UPI request in time',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 14 * DAY_MS + 22 * MINUTE_MS,
						attemptNumber: 3,
						isCompleted: true
					})
				]
			}
		]
	},
	{
		order: {
			orderId: 'ORD-2026-010',
			crn: 'CRN2026062000010',
			customerName: 'Meera Pillai',
			customerEmail: 'meera.pillai@example.com',
			customerPhoneNumber: '+91 98765 43211',
			orderAmount: '₹750.00',
			orderStatus: 'expired',
			statusDescription: 'Payment link expired without payment',
			clientDescription: 'Quick payment',
			createdAt: fmtDate(now - 22 * DAY_MS),
			expiresAt: '2026-06-21',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹750.00',
					transactionStatus: 'pending',
					paymentMethod: 'Wallet',
					paymentChannel: 'WALLET',
					crn: 'CRN2026062000010',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 22 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: []
	},
	{
		order: {
			orderId: 'ORD-2026-019',
			crn: 'CRN2026060100019',
			customerName: 'Mohan Das',
			customerEmail: 'mohan.das@example.com',
			customerPhoneNumber: '+91 99887 76655',
			orderAmount: '₹3,400.00',
			orderStatus: 'failed',
			statusDescription: 'Payment could not be completed',
			clientDescription: 'Annual membership renewal',
			createdAt: fmtDate(now - 95 * DAY_MS),
			expiresAt: '2026-06-02',
			orderTimeline: [
				timelineEntry({
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹3,400.00',
					transactionStatus: 'pending',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026060100019',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					timestampMs: now - 95 * DAY_MS,
					isCompleted: true
				})
			]
		},
		payments: [
			{
				txnId: 'TXN-19001',
				orderId: 'ORD-2026-019',
				attemptNumber: 1,
				customerName: 'Mohan Das',
				transactionAmount: '₹3,400.00',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT',
				paymentStatus: 'failed',
				statusDescription: 'Customer approved UPI request but bank declined the transaction.',
				utr: '',
				bankRRN: 'HDFC2060100001',
				cardNumber: '',
				cardType: '',
				errorDescription: 'Daily UPI transaction limit exceeded',
				payerVpa: 'mohan@okhdfc',
				bankPipelineCode: 'HDFC',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Mohan attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer approved UPI request but bank declined the transaction.',
						txnAmount: '₹3,400.00',
						transactionStatus: 'failed',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026060100019',
						utr: '',
						bankRRN: 'HDFC2060100001',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Transaction declined',
						errorDescription: 'Daily UPI transaction limit exceeded',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 95 * DAY_MS + 5 * MINUTE_MS,
						attemptNumber: 1,
						isCompleted: true
					})
				]
			},
			{
				txnId: 'TXN-19002',
				orderId: 'ORD-2026-019',
				attemptNumber: 2,
				customerName: 'Mohan Das',
				transactionAmount: '₹3,400.00',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT',
				paymentStatus: 'failed',
				statusDescription: 'Customer retried UPI payment the next day.',
				utr: '',
				bankRRN: '',
				cardNumber: '',
				cardType: '',
				errorDescription: 'Customer declined the UPI collect request',
				payerVpa: 'mohan@okhdfc',
				bankPipelineCode: 'HDFC',
				paymentTimeline: [
					timelineEntry({
						entryTitle: 'Mohan attempted payment',
						entryType: 'payment_attempted',
						entryDescription: 'Customer retried UPI payment the next day.',
						txnAmount: '₹3,400.00',
						transactionStatus: 'failed',
						paymentMethod: 'UPI',
						paymentChannel: 'UPI_COLLECT',
						crn: 'CRN2026060100019',
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Payment cancelled',
						errorDescription: 'Customer declined the UPI collect request',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						timestampMs: now - 94 * DAY_MS + 10 * MINUTE_MS,
						attemptNumber: 2,
						isCompleted: true
					})
				]
			}
		]
	}
];

function orderCreatedMs(order: PayinOrderDetail): number {
	return order.orderTimeline[0]?.timestampMs ?? 0;
}

function paymentCreatedMs(payment: PayinPaymentDetail): number {
	return payment.paymentTimeline[0]?.timestampMs ?? 0;
}

export const payinOrderListMock: PayinOrderListItem[] = catalog.map(({ order, payments }) => ({
	orderId: order.orderId,
	crn: order.crn,
	customer: order.customerName,
	amount: order.orderAmount,
	status: order.orderStatus,
	attemptCount: payments.length,
	createdAt: order.createdAt,
	_dateMs: orderCreatedMs(order)
}));

export const payinPaymentListMock: PayinPaymentListItem[] = catalog.flatMap(({ order, payments }) =>
	payments.map((payment) => ({
		txnId: payment.txnId,
		orderId: payment.orderId,
		customer: order.customerName,
		amount: payment.transactionAmount,
		paymentMethod: payment.paymentMethod,
		status: (payment.refunds?.length ?? 0) > 0 ? 'refunded' : payment.paymentStatus,
		attemptNumber: payment.attemptNumber,
		createdAt: fmtDate(paymentCreatedMs(payment)),
		_dateMs: paymentCreatedMs(payment)
	}))
);

export function getPayinOrderDetail(orderId: string): PayinOrderDetail | null {
	return catalog.find((e) => e.order.orderId === orderId)?.order ?? null;
}

export function getPayinPaymentDetail(txnId: string): PayinPaymentDetail | null {
	for (const entry of catalog) {
		const payment = entry.payments.find((p) => p.txnId === txnId);
		if (payment) return payment;
	}
	return null;
}

export function getPaymentsByOrderId(orderId: string): PayinPaymentDetail[] {
	return catalog.find((e) => e.order.orderId === orderId)?.payments ?? [];
}
